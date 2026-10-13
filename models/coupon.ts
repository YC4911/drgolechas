import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export type CouponDiscountType = "percentage" | "fixed";

export interface CouponRecord {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumCartValue: number;
  maximumDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  applicableProducts: Types.ObjectId[];
  applicableCategories: Types.ObjectId[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new Schema<CouponRecord>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumCartValue: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    applicableProducts: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    applicableCategories: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.index({ active: 1, startDate: 1, expiryDate: 1 });

export const CouponModel = registerModel("Coupon", couponSchema);
