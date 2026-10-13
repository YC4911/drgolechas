import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export const PAYMENT_METHODS = [
  "cod",
  "upi",
  "card",
  "netbanking",
  "wallet",
  "other",
] as const;
export const PAYMENT_RECORD_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export interface PaymentRecord {
  order: Types.ObjectId;
  user: Types.ObjectId;
  provider: string;
  method: (typeof PAYMENT_METHODS)[number];
  gatewayOrderId?: string;
  cartFingerprint?: string;
  transactionReference?: string;
  amount: number;
  currency: string;
  status: (typeof PAYMENT_RECORD_STATUSES)[number];
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new Schema<PaymentRecord>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: { type: String, required: true, trim: true, maxlength: 80 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    gatewayOrderId: { type: String, trim: true },
    cartFingerprint: { type: String, trim: true, select: false },
    transactionReference: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: "pending" },
  },
  { timestamps: true },
);

paymentSchema.index(
  { transactionReference: 1 },
  { unique: true, sparse: true },
);
paymentSchema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ user: 1, provider: 1, cartFingerprint: 1, status: 1 });

export const PaymentModel = registerModel("Payment", paymentSchema);
