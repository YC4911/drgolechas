import { Schema } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface PaymentWebhookEventRecord {
  eventId: string;
  event: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentWebhookEventSchema = new Schema<PaymentWebhookEventRecord>(
  {
    eventId: { type: String, required: true, trim: true, unique: true },
    event: { type: String, required: true, trim: true, maxlength: 100 },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

paymentWebhookEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export const PaymentWebhookEventModel = registerModel(
  "PaymentWebhookEvent",
  paymentWebhookEventSchema,
);
