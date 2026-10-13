import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export const USER_ROLES = ["customer", "admin", "staff", "superadmin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  addresses: Types.ObjectId[];
  active: boolean;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, trim: true, maxlength: 32 },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      required: true,
    },
    avatar: { type: String, trim: true },
    addresses: {
      type: [{ type: Schema.Types.ObjectId, ref: "Address" }],
      default: [],
    },
    active: { type: Boolean, default: true, required: true },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, active: 1 });
userSchema.index({ passwordResetTokenHash: 1 }, { unique: true, sparse: true });

export const UserModel = registerModel("User", userSchema);
