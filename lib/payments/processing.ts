import type { CouponReservation } from "@/lib/checkout/reservations";
import mongoose from "mongoose";
import { releaseCouponUsage } from "@/lib/checkout/reservations";
import { fingerprintCart } from "@/lib/cart/fingerprint";
import { ApiError } from "@/lib/api/errors";
import { CartModel } from "@/models/cart";
import { InventoryModel } from "@/models/inventory";
import { OrderModel } from "@/models/order";
import { PaymentModel, type PaymentRecord } from "@/models/payment";
import { ProductModel } from "@/models/product";
import { scheduleOrderEmail } from "@/services/email/order-notifications";
import {
  captureRazorpayPayment,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

type RazorpayPaymentData = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: "upi" | "card" | "netbanking" | "wallet" | "emi" | "paylater";
  amount_refunded?: number;
};

function paymentMethod(
  method: RazorpayPaymentData["method"],
): PaymentRecord["method"] {
  if (
    method === "upi" ||
    method === "card" ||
    method === "netbanking" ||
    method === "wallet"
  ) {
    return method;
  }
  return method === "emi" ? "card" : "other";
}

export async function synchronizeRazorpayPayment(data: RazorpayPaymentData) {
  const payment = await PaymentModel.findOne({
    provider: "razorpay",
    gatewayOrderId: data.order_id,
  })
    .select("+cartFingerprint")
    .exec();
  if (!payment) throw new ApiError("Payment order was not found.", 404);
  if (
    data.currency !== payment.currency ||
    data.amount !== Math.round(payment.amount * 100)
  ) {
    throw new ApiError(
      "Payment amount or currency does not match the order.",
      409,
    );
  }

  if (data.status === "captured") {
    const session = await mongoose.startSession();
    let orderNumber = "";
    let paymentCaptured = false;
    try {
      await session.withTransaction(async () => {
        const result = await PaymentModel.updateOne(
          { _id: payment._id, status: { $ne: "paid" } },
          {
            $set: {
              status: "paid",
              method: paymentMethod(data.method),
              transactionReference: data.id,
            },
          },
          { session },
        ).exec();
        paymentCaptured = result.modifiedCount === 1;
        const order = await OrderModel.findOne({
          _id: payment.order,
          user: payment.user,
        })
          .select("orderNumber items")
          .session(session)
          .lean()
          .exec();
        if (!order)
          throw new ApiError("The order for this payment was not found.", 404);
        orderNumber = order.orderNumber;

        await OrderModel.updateOne(
          {
            _id: payment.order,
            paymentStatus: { $ne: "paid" },
            orderStatus: "pending",
          },
          { $set: { paymentStatus: "paid", orderStatus: "confirmed" } },
          { session },
        ).exec();
        if (result.modifiedCount === 1) {
          const cart = await CartModel.findOne({ user: payment.user })
            .session(session)
            .exec();
          if (
            cart &&
            payment.cartFingerprint &&
            fingerprintCart(cart) === payment.cartFingerprint
          ) {
            await CartModel.updateOne(
              { _id: cart._id, __v: cart.__v },
              {
                $set: { items: [] },
                $unset: { couponCode: 1 },
                $inc: { __v: 1 },
              },
              { session },
            ).exec();
          }
          for (const item of order.items) {
            await InventoryModel.updateOne(
              { product: item.product, reserved: { $gte: item.quantity } },
              { $inc: { reserved: -item.quantity } },
              { session },
            ).exec();
          }
        }
      });
    } finally {
      await session.endSession();
    }
    if (paymentCaptured) {
      scheduleOrderEmail(payment.order.toString(), "orderConfirmation");
      scheduleOrderEmail(payment.order.toString(), "paymentConfirmation");
    }
    return {
      orderId: payment.order.toString(),
      orderNumber,
      status: "paid" as const,
    };
  }

  if (data.status === "failed") {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await PaymentModel.updateOne(
          { _id: payment._id, status: "pending" },
          { $set: { status: "failed" } },
          { session },
        ).exec();
        await OrderModel.updateOne(
          { _id: payment.order, paymentStatus: "pending" },
          { $set: { paymentStatus: "failed" } },
          { session },
        ).exec();
      });
    } finally {
      await session.endSession();
    }
    const order = await OrderModel.findById(payment.order)
      .select("orderNumber")
      .lean()
      .exec();
    return {
      orderId: payment.order.toString(),
      orderNumber: order?.orderNumber ?? "",
      status: "failed" as const,
    };
  }

  if (
    data.status === "refunded" &&
    data.amount_refunded !== undefined &&
    data.amount_refunded >= data.amount
  ) {
    const session = await mongoose.startSession();
    let orderRefunded = false;
    try {
      await session.withTransaction(async () => {
        await PaymentModel.updateOne(
          { _id: payment._id, status: "paid" },
          { $set: { status: "refunded" } },
          { session },
        ).exec();
        const result = await OrderModel.updateOne(
          { _id: payment.order, paymentStatus: "paid" },
          { $set: { paymentStatus: "refunded", orderStatus: "refunded" } },
          { session },
        ).exec();
        orderRefunded = result.modifiedCount === 1;
      });
    } finally {
      await session.endSession();
    }
    if (orderRefunded) scheduleOrderEmail(payment.order.toString(), "refund");
    const order = await OrderModel.findById(payment.order)
      .select("orderNumber")
      .lean()
      .exec();
    return {
      orderId: payment.order.toString(),
      orderNumber: order?.orderNumber ?? "",
      status: "refunded" as const,
    };
  }

  return {
    orderId: payment.order.toString(),
    status: "pending" as const,
  };
}

export async function recordMockPaymentOutcome(
  userId: string,
  orderId: string,
  outcome: "failed" | "cancelled",
) {
  const payment = await PaymentModel.findOne({
    order: orderId,
    user: userId,
    provider: "mock",
  }).exec();
  if (!payment) throw new ApiError("Development payment was not found.", 404);
  const changed = await PaymentModel.updateOne(
    { _id: payment._id, status: "pending" },
    { $set: { status: "failed" } },
  ).exec();
  if (changed.modifiedCount !== 1) {
    const existing = await OrderModel.findOne({ _id: orderId, user: userId })
      .select("orderNumber paymentStatus orderStatus")
      .lean()
      .exec();
    if (!existing) throw new ApiError("Order was not found.", 404);
    return { ...existing, duplicate: true };
  }

  await OrderModel.updateOne(
    { _id: orderId, user: userId, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "failed",
        ...(outcome === "cancelled" ? { orderStatus: "cancelled" } : {}),
      },
    },
  ).exec();
  const order = await OrderModel.findOne({ _id: orderId, user: userId })
    .select(
      "orderNumber paymentStatus orderStatus items.product items.sku items.quantity coupon",
    )
    .lean()
    .exec();
  if (!order) throw new ApiError("Order was not found.", 404);

  for (const item of order.items) {
    const hasInventory = Boolean(
      await InventoryModel.exists({ product: item.product }),
    );
    if (hasInventory) {
      await InventoryModel.updateOne(
        { product: item.product, reserved: { $gte: item.quantity } },
        { $inc: { reserved: -item.quantity } },
      ).exec();
    }
    const restoredVariant = await ProductModel.updateOne(
      { _id: item.product, "variants.sku": item.sku },
      { $inc: { "variants.$[variant].stock": item.quantity } },
      { arrayFilters: [{ "variant.sku": item.sku }] },
    ).exec();
    if (restoredVariant.modifiedCount === 0 && !hasInventory) {
      await ProductModel.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
      ).exec();
    }
  }
  if (order.coupon) {
    const couponReservation: CouponReservation = {
      couponId: order.coupon.toString(),
      userId,
    };
    await releaseCouponUsage(couponReservation);
  }

  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    duplicate: false,
  };
}

export async function verifyCustomerRazorpayPayment(
  userId: string,
  data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
) {
  const payment = await PaymentModel.findOne({
    provider: "razorpay",
    gatewayOrderId: data.razorpay_order_id,
    user: userId,
  })
    .select("order user amount currency status")
    .lean()
    .exec();
  if (!payment) throw new ApiError("Payment order was not found.", 404);
  if (
    !verifyRazorpaySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
    )
  ) {
    throw new ApiError("Razorpay payment signature is invalid.", 400);
  }

  let gatewayPayment = await getRazorpayPayment(data.razorpay_payment_id);
  if (gatewayPayment.order_id !== data.razorpay_order_id) {
    throw new ApiError("Payment is linked to a different order.", 409);
  }
  gatewayPayment = await captureRazorpayPayment(gatewayPayment);
  const result = await synchronizeRazorpayPayment(gatewayPayment);
  if (result.orderId !== payment.order.toString()) {
    throw new ApiError("Payment order reference does not match.", 409);
  }
  return result;
}

export function parseWebhookPayment(
  value: unknown,
): RazorpayPaymentData | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.order_id !== "string" ||
    typeof candidate.amount !== "number" ||
    typeof candidate.currency !== "string" ||
    (candidate.status !== "captured" &&
      candidate.status !== "failed" &&
      candidate.status !== "authorized" &&
      candidate.status !== "created" &&
      candidate.status !== "refunded")
  ) {
    return null;
  }
  const method =
    candidate.method === "upi" ||
    candidate.method === "card" ||
    candidate.method === "netbanking" ||
    candidate.method === "wallet" ||
    candidate.method === "emi" ||
    candidate.method === "paylater"
      ? candidate.method
      : undefined;
  return {
    id: candidate.id,
    order_id: candidate.order_id,
    amount: candidate.amount,
    currency: candidate.currency,
    status: candidate.status,
    method,
    amount_refunded:
      typeof candidate.amount_refunded === "number"
        ? candidate.amount_refunded
        : undefined,
  };
}
