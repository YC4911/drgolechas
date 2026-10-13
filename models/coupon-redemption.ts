import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface CouponRedemptionRecord {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const couponRedemptionSchema = new Schema<CouponRedemptionRecord>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

couponRedemptionSchema.index({ coupon: 1, user: 1 }, { unique: true });

export const CouponRedemptionModel = registerModel(
  "CouponRedemption",
  couponRedemptionSchema,
);