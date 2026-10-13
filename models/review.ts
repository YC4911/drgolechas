import { Schema } from "mongoose";
import { registerModel } from "@/models/register-model";
import type { Types } from "mongoose";

export interface ReviewRecord {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  approved: boolean;
  moderationStatus?: "pending" | "approved" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<ReviewRecord>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 3000 },
    verifiedPurchase: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, approved: 1, createdAt: -1 });
reviewSchema.index({ moderationStatus: 1, createdAt: -1 });

export const ReviewModel = registerModel("Review", reviewSchema);
