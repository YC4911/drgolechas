import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface InventoryRecord {
  product: Types.ObjectId;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const inventorySchema = new Schema<InventoryRecord>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },
    quantity: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true },
);

export const InventoryModel = registerModel("Inventory", inventorySchema);
