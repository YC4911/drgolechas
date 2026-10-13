import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface CartItemRecord {
  product: Types.ObjectId;
  variantSku?: string;
  quantity: number;
}

export interface CartRecord {
  user?: Types.ObjectId;
  guestTokenHash?: string;
  items: CartItemRecord[];
  couponCode?: string;
  checkoutLockKey?: string;
  checkoutLockExpiresAt?: Date;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const cartItemSchema = new Schema<CartItemRecord>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, trim: true, uppercase: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false },
);

const cartSchema = new Schema<CartRecord>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestTokenHash: { type: String, select: false },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, uppercase: true, trim: true },
    checkoutLockKey: { type: String, select: false },
    checkoutLockExpiresAt: { type: Date, select: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } },
);
cartSchema.index(
  { guestTokenHash: 1 },
  { unique: true, partialFilterExpression: { guestTokenHash: { $type: "string" } } },
);
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.pre("validate", function validateOwner() {
  if (Boolean(this.user) === Boolean(this.guestTokenHash)) {
    throw new Error("A cart must have exactly one owner.");
  }
});

export const CartModel = registerModel("Cart", cartSchema);