import { ApiError } from "@/lib/api/errors";
import type { CartLineView } from "@/types/cart";
import { CouponModel } from "@/models/coupon";
import { CouponRedemptionModel } from "@/models/coupon-redemption";
import { InventoryModel } from "@/models/inventory";
import { ProductModel } from "@/models/product";
import { Types } from "mongoose";

export type StockReservation =
  | { kind: "inventory"; productId: string; quantity: number }
  | { kind: "product"; productId: string; quantity: number }
  | { kind: "variant"; productId: string; sku: string; quantity: number };

export interface CouponReservation {
  couponId: string;
  userId: string;
}

export async function reserveStock(
  line: CartLineView,
): Promise<StockReservation[]> {
  const quantity = line.quantity;
  const reservations: StockReservation[] = [];
  const product = await ProductModel.findOne({
    _id: line.productId,
    active: true,
  })
    .select("publicationStatus priceApproved productDetailsVerified variants")
    .lean()
    .exec();
  const variant = line.variantSku
    ? product?.variants.find(
        (item) => item.sku.toUpperCase() === line.variantSku?.toUpperCase(),
      )
    : undefined;
  if (
    !product ||
    (product.publicationStatus ?? "published") !== "published" ||
    product.priceApproved === false ||
    product.productDetailsVerified === false ||
    (line.variantSku && (!variant || variant.priceApproved === false))
  ) {
    throw new ApiError(`${line.name} is not approved for sale.`, 409);
  }
  const inventory = await InventoryModel.exists({ product: line.productId });

  if (inventory) {
    const reserved = await InventoryModel.updateOne(
      {
        product: line.productId,
        $expr: {
          $gte: [{ $subtract: ["$quantity", "$reserved"] }, quantity],
        },
      },
      { $inc: { reserved: quantity } },
    ).exec();
    if (reserved.modifiedCount !== 1) {
      throw new ApiError(`${line.name} no longer has enough stock.`, 409);
    }
    reservations.push({
      kind: "inventory",
      productId: line.productId,
      quantity,
    });
  }

  if (line.variantSku) {
    const updated = await ProductModel.updateOne(
      { _id: line.productId, active: true },
      { $inc: { "variants.$[variant].stock": -quantity } },
      {
        arrayFilters: [
          {
            "variant.sku": line.variantSku,
            "variant.stock": { $gte: quantity },
          },
        ],
      },
    ).exec();
    if (updated.modifiedCount !== 1) {
      if (inventory) {
        await InventoryModel.updateOne(
          { product: line.productId, reserved: { $gte: quantity } },
          { $inc: { reserved: -quantity } },
        ).exec();
      }
      throw new ApiError(`${line.name} no longer has enough stock.`, 409);
    }
    reservations.push({
      kind: "variant",
      productId: line.productId,
      sku: line.variantSku,
      quantity,
    });
  } else if (!inventory) {
    const updated = await ProductModel.updateOne(
      { _id: line.productId, active: true, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    ).exec();
    if (updated.modifiedCount !== 1) {
      throw new ApiError(`${line.name} no longer has enough stock.`, 409);
    }
    reservations.push({ kind: "product", productId: line.productId, quantity });
  }

  return reservations;
}

export async function releaseStock(
  reservations: StockReservation[],
): Promise<void> {
  for (const reservation of [...reservations].reverse()) {
    if (reservation.kind === "inventory") {
      await InventoryModel.updateOne(
        {
          product: reservation.productId,
          reserved: { $gte: reservation.quantity },
        },
        { $inc: { reserved: -reservation.quantity } },
      ).exec();
    } else if (reservation.kind === "product") {
      await ProductModel.updateOne(
        { _id: reservation.productId },
        { $inc: { stock: reservation.quantity } },
      ).exec();
    } else {
      await ProductModel.updateOne(
        { _id: reservation.productId },
        { $inc: { "variants.$[variant].stock": reservation.quantity } },
        { arrayFilters: [{ "variant.sku": reservation.sku }] },
      ).exec();
    }
  }
}

export async function reserveCouponUsage(
  couponId: string,
  userId: string,
): Promise<CouponReservation> {
  const now = new Date();
  const coupon = await CouponModel.findOneAndUpdate(
    {
      _id: couponId,
      active: true,
      startDate: { $lte: now },
      expiryDate: { $gt: now },
      $or: [
        { usageLimit: { $exists: false } },
        { $expr: { $lt: [{ $ifNull: ["$usageCount", 0] }, "$usageLimit"] } },
      ],
    },
    { $inc: { usageCount: 1 } },
    { returnDocument: "after" },
  )
    .select("_id perUserLimit")
    .lean()
    .exec();

  if (!coupon) throw new ApiError("Coupon usage limit has been reached.", 422);

  try {
    const existing = await CouponRedemptionModel.findOne({
      coupon: coupon._id,
      user: userId,
    })
      .select("count")
      .lean()
      .exec();

    if (!existing) {
      await CouponRedemptionModel.create({
        coupon: coupon._id,
        user: userId,
        count: 1,
      });
    } else {
      const updated = await CouponRedemptionModel.updateOne(
        {
          coupon: coupon._id,
          user: userId,
          count: { $lt: coupon.perUserLimit },
        },
        { $inc: { count: 1 } },
      ).exec();
      if (updated.modifiedCount !== 1) {
        throw new ApiError(
          "This coupon has reached its per-customer limit.",
          422,
        );
      }
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const updated = await CouponRedemptionModel.updateOne(
        {
          coupon: coupon._id,
          user: userId,
          count: { $lt: coupon.perUserLimit },
        },
        { $inc: { count: 1 } },
      ).exec();
      if (updated.modifiedCount === 1) {
        return { couponId: coupon._id.toString(), userId };
      }
    }

    await CouponModel.updateOne(
      { _id: coupon._id, usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
    ).exec();
    if (error instanceof ApiError) throw error;
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ApiError(
        "This coupon has reached its per-customer limit.",
        422,
      );
    }
    throw error;
  }

  return { couponId: coupon._id.toString(), userId };
}

export async function releaseCouponUsage(
  reservation: CouponReservation,
): Promise<void> {
  const couponId = new Types.ObjectId(reservation.couponId);
  await Promise.all([
    CouponModel.updateOne(
      { _id: couponId, usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
    ).exec(),
    CouponRedemptionModel.updateOne(
      { coupon: couponId, user: reservation.userId, count: { $gt: 0 } },
      { $inc: { count: -1 } },
    ).exec(),
  ]);
  await CouponRedemptionModel.deleteOne({
    coupon: couponId,
    user: reservation.userId,
    count: 0,
  }).exec();
}
