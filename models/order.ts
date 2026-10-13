import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cod",
] as const;

export interface OrderItemRecord {
  product: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  total: number;
  image: string;
  variant?: string;
}

export interface OrderAddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderRecord {
  orderNumber: string;
  idempotencyKey?: string;
  user: Types.ObjectId;
  items: OrderItemRecord[];
  shippingAddress: OrderAddressSnapshot;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  coupon?: Types.ObjectId | null;
  payment?: Types.ObjectId | null;
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
  orderStatus: (typeof ORDER_STATUSES)[number];
  trackingNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItemRecord>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    variant: { type: String, trim: true },
  },
  { _id: false },
);

const orderAddressSchema = new Schema<OrderAddressSnapshot>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderRecord>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    idempotencyKey: { type: String, unique: true, sparse: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (items: unknown[]) => Array.isArray(items) && items.length > 0,
        "An order requires at least one item.",
      ],
    },
    shippingAddress: { type: orderAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending" },
    trackingNumber: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ coupon: 1, user: 1, orderStatus: 1 });

export const OrderModel = registerModel("Order", orderSchema);
