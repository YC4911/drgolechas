import { randomBytes, randomUUID } from "node:crypto";
import { Types } from "mongoose";
import type { AddressInput } from "@/lib/auth/validation";
import { ApiError } from "@/lib/api/errors";
import { fingerprintCart } from "@/lib/cart/fingerprint";
import {
  claimCartForCheckout,
  releaseCartCheckoutLock,
} from "@/lib/checkout/cart-lock";
import { CartOwner } from "@/lib/cart/context";
import { buildCartSnapshot } from "@/lib/cart/service";
import {
  reserveCouponUsage,
  reserveStock,
  releaseCouponUsage,
  releaseStock,
  type CouponReservation,
  type StockReservation,
} from "@/lib/checkout/reservations";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { AddressModel } from "@/models/address";
import { CartModel } from "@/models/cart";
import { CouponModel } from "@/models/coupon";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";
import { UserModel } from "@/models/user";

export interface CreateCodOrderInput {
  addressId?: string;
  newAddress?: AddressInput;
  saveAddress: boolean;
}

type ShippingAddressSnapshot = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function makeOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `DG-${timestamp}-${suffix}`;
}

async function prepareCheckout(userId: string, input: CreateCodOrderInput) {
  const user = await UserModel.findOne({
    _id: userId,
    active: true,
    role: "customer",
  })
    .select("name email phone")
    .lean()
    .exec();
  if (!user) throw new ApiError("Customer account is unavailable.", 401);

  let address: ShippingAddressSnapshot;
  if (input.addressId) {
    const savedAddress = await AddressModel.findOne({
      _id: input.addressId,
      user: userId,
    })
      .lean()
      .exec();
    if (!savedAddress)
      throw new ApiError("Selected address was not found.", 404);
    address = {
      name: savedAddress.recipientName,
      phone: savedAddress.phone,
      line1: savedAddress.line1,
      line2: savedAddress.line2,
      landmark: savedAddress.landmark,
      city: savedAddress.city,
      state: savedAddress.state,
      postalCode: savedAddress.postalCode,
      country: savedAddress.country,
    };
  } else if (input.newAddress) {
    address = {
      name: input.newAddress.recipientName,
      phone: input.newAddress.phone,
      line1: input.newAddress.line1,
      line2: input.newAddress.line2,
      landmark: input.newAddress.landmark,
      city: input.newAddress.city,
      state: input.newAddress.state,
      postalCode: input.newAddress.postalCode,
      country: input.newAddress.country,
    };
  } else {
    throw new ApiError("A shipping address is required.", 400);
  }

  const owner: CartOwner = {
    kind: "user",
    userId,
    filter: { user: userId },
  };
  const cart = await CartModel.findOne({ user: userId }).exec();
  if (!cart || cart.items.length === 0) {
    throw new ApiError("Your cart is empty.", 409);
  }
  const snapshot = await buildCartSnapshot(cart, owner);
  if (!snapshot.canCheckout) {
    throw new ApiError(
      snapshot.couponError ?? "Resolve unavailable cart items before checkout.",
      409,
    );
  }
  return { cart, snapshot, address };
}

async function reserveCheckout(
  userId: string,
  snapshot: Awaited<ReturnType<typeof buildCartSnapshot>>,
) {
  const stock: StockReservation[] = [];
  let coupon: CouponReservation | null = null;
  try {
    for (const item of snapshot.items) {
      stock.push(...(await reserveStock(item)));
    }
    let couponId: Types.ObjectId | null = null;
    if (snapshot.couponCode) {
      const record = await CouponModel.findOne({ code: snapshot.couponCode })
        .select("_id")
        .lean()
        .exec();
      if (!record) throw new ApiError("Coupon is no longer valid.", 409);
      coupon = await reserveCouponUsage(record._id.toString(), userId);
      couponId = record._id;
    }
    return { stock, coupon, couponId };
  } catch (error) {
    await releaseStock(stock);
    if (coupon) await releaseCouponUsage(coupon);
    throw error;
  }
}

function createOrderItems(
  snapshot: Awaited<ReturnType<typeof buildCartSnapshot>>,
) {
  return snapshot.items.map((item) => ({
    product: new Types.ObjectId(item.productId),
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    mrp: item.mrp,
    total: item.lineSubtotal,
    image: item.image,
    variant: item.variantName ?? undefined,
  }));
}

async function saveNewAddress(
  userId: string,
  input: CreateCodOrderInput,
): Promise<void> {
  if (!input.saveAddress || !input.newAddress) return;
  const addressCount = await AddressModel.countDocuments({ user: userId });
  const savedAddress = await AddressModel.create({
    ...input.newAddress,
    user: userId,
    isDefault: addressCount === 0,
  });
  await UserModel.updateOne(
    { _id: userId },
    { $addToSet: { addresses: savedAddress._id } },
  ).exec();
}

async function findOrderByIdempotencyKey(
  userId: string,
  idempotencyKey: string,
) {
  return OrderModel.findOne({ user: userId, idempotencyKey })
    .select(
      "orderNumber orderStatus paymentStatus total createdAt payment items.name items.quantity items.total shippingAddress",
    )
    .lean()
    .exec();
}

async function createCodOrderLocked(
  userId: string,
  idempotencyKey: string,
  input: CreateCodOrderInput,
) {
  const existing = await findOrderByIdempotencyKey(userId, idempotencyKey);
  if (existing) return { order: existing, duplicate: true };

  const { cart, snapshot, address } = await prepareCheckout(userId, input);
  const reservation = await reserveCheckout(userId, snapshot);
  let createdOrderId: Types.ObjectId | null = null;
  try {
    const order = await OrderModel.create({
      orderNumber: makeOrderNumber(),
      idempotencyKey,
      user: userId,
      items: createOrderItems(snapshot),
      shippingAddress: address,
      subtotal: snapshot.totals.subtotal,
      discount: snapshot.totals.couponDiscount,
      tax: snapshot.totals.tax,
      shipping: snapshot.totals.shipping,
      total: snapshot.totals.total,
      coupon: reservation.couponId,
      payment: null,
      paymentStatus: "cod",
      orderStatus: "pending",
    });
    createdOrderId = order._id;
    await saveNewAddress(userId, input);
    cart.items.splice(0, cart.items.length);
    cart.couponCode = undefined;
    await cart.save();
    return { order, duplicate: false };
  } catch (error) {
    if (createdOrderId)
      await OrderModel.deleteOne({ _id: createdOrderId }).exec();
    await releaseStock(reservation.stock);
    if (reservation.coupon) await releaseCouponUsage(reservation.coupon);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const duplicate = await findOrderByIdempotencyKey(userId, idempotencyKey);
      if (duplicate) return { order: duplicate, duplicate: true };
    }
    throw error;
  }
}

export async function createCodOrder(
  userId: string,
  idempotencyKey: string,
  input: CreateCodOrderInput,
) {
  const existing = await findOrderByIdempotencyKey(userId, idempotencyKey);
  if (existing) return { order: existing, duplicate: true };
  await claimCartForCheckout(userId, idempotencyKey);
  try {
    return await createCodOrderLocked(userId, idempotencyKey, input);
  } finally {
    await releaseCartCheckoutLock(userId, idempotencyKey);
  }
}

async function createRazorpayCheckoutOrderLocked(
  userId: string,
  idempotencyKey: string,
  input: CreateCodOrderInput,
  mode: "live" | "mock" = "live",
) {
  const existing = await findOrderByIdempotencyKey(userId, idempotencyKey);
  if (existing) {
    const payment = existing.payment
      ? await PaymentModel.findById(existing.payment)
          .select("provider gatewayOrderId amount currency status")
          .lean()
          .exec()
      : null;
    if (
      !payment?.gatewayOrderId ||
      payment.provider !== (mode === "mock" ? "mock" : "razorpay")
    ) {
      throw new ApiError(
        "This checkout key was already used for another order.",
        409,
      );
    }
    return { order: existing, payment, duplicate: true };
  }

  const { cart, snapshot, address } = await prepareCheckout(userId, input);
  const cartFingerprint = fingerprintCart(cart);
  const previousPayment = await PaymentModel.findOne({
    user: userId,
    provider: mode === "mock" ? "mock" : "razorpay",
    cartFingerprint,
    status: { $in: ["pending", "failed"] },
  })
    .select("order provider gatewayOrderId amount currency status")
    .exec();
  if (previousPayment) {
    const previousOrder = await OrderModel.findOne({
      _id: previousPayment.order,
      user: userId,
      orderStatus: "pending",
    })
      .select(
        "orderNumber orderStatus paymentStatus total createdAt payment items.name items.quantity items.total shippingAddress",
      )
      .lean()
      .exec();
    if (previousOrder) {
      return {
        order: previousOrder,
        payment: previousPayment,
        duplicate: true,
      };
    }
  }
  const reservation = await reserveCheckout(userId, snapshot);
  let createdOrderId: Types.ObjectId | null = null;
  let createdPaymentId: Types.ObjectId | null = null;
  try {
    const orderNumber = makeOrderNumber();
    const gatewayOrder =
      mode === "live"
        ? await createRazorpayOrder(
            Math.round(snapshot.totals.total * 100),
            orderNumber,
          )
        : { id: `mock_${randomUUID()}` };
    const order = await OrderModel.create({
      orderNumber,
      idempotencyKey,
      user: userId,
      items: createOrderItems(snapshot),
      shippingAddress: address,
      subtotal: snapshot.totals.subtotal,
      discount: snapshot.totals.couponDiscount,
      tax: snapshot.totals.tax,
      shipping: snapshot.totals.shipping,
      total: snapshot.totals.total,
      coupon: reservation.couponId,
      paymentStatus: "pending",
      orderStatus: "pending",
    });
    createdOrderId = order._id;
    const payment = await PaymentModel.create({
      order: order._id,
      user: userId,
      provider: mode === "mock" ? "mock" : "razorpay",
      method: "other",
      gatewayOrderId: gatewayOrder.id,
      cartFingerprint,
      amount: snapshot.totals.total,
      currency: "INR",
      status: "pending",
    });
    createdPaymentId = payment._id;
    order.payment = payment._id;
    await order.save();
    await saveNewAddress(userId, input);
    return { order, payment, duplicate: false };
  } catch (error) {
    if (createdOrderId)
      await OrderModel.deleteOne({ _id: createdOrderId }).exec();
    if (createdPaymentId)
      await PaymentModel.deleteOne({ _id: createdPaymentId }).exec();
    await releaseStock(reservation.stock);
    if (reservation.coupon) await releaseCouponUsage(reservation.coupon);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const duplicate = await findOrderByIdempotencyKey(userId, idempotencyKey);
      if (duplicate?.payment) {
        const payment = await PaymentModel.findById(duplicate.payment)
          .select("provider gatewayOrderId amount currency status")
          .lean()
          .exec();
        if (
          payment?.gatewayOrderId &&
          payment.provider === (mode === "mock" ? "mock" : "razorpay")
        ) {
          return { order: duplicate, payment, duplicate: true };
        }
      }
    }
    throw error;
  }
}

export async function createRazorpayCheckoutOrder(
  userId: string,
  idempotencyKey: string,
  input: CreateCodOrderInput,
  mode: "live" | "mock" = "live",
) {
  const existing = await findOrderByIdempotencyKey(userId, idempotencyKey);
  if (existing) {
    const payment = existing.payment
      ? await PaymentModel.findById(existing.payment)
          .select("provider gatewayOrderId amount currency status")
          .lean()
          .exec()
      : null;
    if (
      !payment?.gatewayOrderId ||
      payment.provider !== (mode === "mock" ? "mock" : "razorpay")
    ) {
      throw new ApiError(
        "This checkout key was already used for another order.",
        409,
      );
    }
    return { order: existing, payment, duplicate: true };
  }

  await claimCartForCheckout(userId, idempotencyKey);
  try {
    return await createRazorpayCheckoutOrderLocked(
      userId,
      idempotencyKey,
      input,
      mode,
    );
  } finally {
    await releaseCartCheckoutLock(userId, idempotencyKey);
  }
}
