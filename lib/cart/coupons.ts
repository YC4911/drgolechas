import { ApiError } from "@/lib/api/errors";
import { CouponModel } from "@/models/coupon";
import { CouponRedemptionModel } from "@/models/coupon-redemption";
import { OrderModel } from "@/models/order";

export interface CouponLine {
  productId: string;
  variantSku?: string;
  categoryId: string;
  subcategoryId: string | null;
  lineSubtotal: number;
}

export interface ValidatedCoupon {
  id: string;
  code: string;
  discount: number;
  eligibleSubtotal: number;
  eligibleLineKeys: string[];
}

export async function validateCouponForCart(
  code: string,
  lines: CouponLine[],
  customerId?: string,
): Promise<ValidatedCoupon> {
  const coupon = await CouponModel.findOne({ code: code.trim().toUpperCase() })
    .lean()
    .exec();
  const now = new Date();

  if (!coupon || !coupon.active) throw new ApiError("Coupon is not valid.", 422);
  if (coupon.startDate > now) throw new ApiError("Coupon is not active yet.", 422);
  if (coupon.expiryDate <= now) throw new ApiError("Coupon has expired.", 422);
  if (
    coupon.usageLimit !== undefined &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    throw new ApiError("Coupon usage limit has been reached.", 422);
  }
  if (customerId) {
    const redemption = await CouponRedemptionModel.findOne({
      coupon: coupon._id,
      user: customerId,
    })
      .select("count")
      .lean()
      .exec();
    const userUsage = redemption
      ? redemption.count
      : await OrderModel.countDocuments({
          coupon: coupon._id,
          user: customerId,
          orderStatus: { $nin: ["cancelled", "returned", "refunded"] },
        });
    if (userUsage >= coupon.perUserLimit) {
      throw new ApiError("This coupon has reached its per-customer limit.", 422);
    }
  }

  const productIds = new Set(coupon.applicableProducts.map(String));
  const categoryIds = new Set(coupon.applicableCategories.map(String));
  const restricted = productIds.size > 0 || categoryIds.size > 0;
  const eligibleLines = restricted
    ? lines.filter(
        (line) =>
          productIds.has(line.productId) ||
          categoryIds.has(line.categoryId) ||
          (line.subcategoryId !== null && categoryIds.has(line.subcategoryId)),
      )
    : lines;
  const eligibleSubtotal = eligibleLines.reduce(
    (sum, line) => sum + line.lineSubtotal,
    0,
  );

  if (eligibleSubtotal <= 0) {
    throw new ApiError("Coupon does not apply to items in this cart.", 422);
  }
  if (eligibleSubtotal < coupon.minimumCartValue) {
    throw new ApiError("Cart value does not meet the coupon minimum.", 422);
  }

  const rawDiscount =
    coupon.discountType === "percentage"
      ? (eligibleSubtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  const discount = Math.round(
    Math.min(rawDiscount, coupon.maximumDiscount ?? Number.MAX_SAFE_INTEGER, eligibleSubtotal) *
      100,
  ) / 100;

  return {
    id: coupon._id.toString(),
    code: coupon.code,
    discount,
    eligibleSubtotal,
    eligibleLineKeys: eligibleLines.map(
      (line) => `${line.productId}:${line.variantSku ?? ""}`,
    ),
  };
}