import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export type AdminRole = "admin" | "staff" | "superadmin";

export interface AdminRecord {
  user: Types.ObjectId;
  email: string;
  role: AdminRole;
  permissions: string[];
  active: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const adminSchema = new Schema<AdminRecord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "superadmin"],
      required: true,
    },
    permissions: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

adminSchema.index({ role: 1, active: 1 });

export const AdminModel = registerModel("Admin", adminSchema);
