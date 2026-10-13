import { Schema } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface AuthRateLimitRecord {
  key: string;
  count: number;
  expiresAt: Date;
}

const authRateLimitSchema = new Schema<AuthRateLimitRecord>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

authRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthRateLimitModel = registerModel(
  "AuthRateLimit",
  authRateLimitSchema,
);
