import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface UserSessionRecord {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSessionSchema = new Schema<UserSessionRecord>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

userSessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSessionModel = registerModel("UserSession", userSessionSchema);
