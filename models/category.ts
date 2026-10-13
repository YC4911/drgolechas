import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface CategoryRecord {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentCategory: Types.ObjectId | null;
  active: boolean;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const categorySchema = new Schema<CategoryRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    image: { type: String, default: "", trim: true },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    active: { type: Boolean, default: true, required: true },
    displayOrder: { type: Number, default: 0, min: 0 },
    seoTitle: { type: String, trim: true, maxlength: 160 },
    seoDescription: { type: String, trim: true, maxlength: 320 },
  },
  { timestamps: true },
);

categorySchema.index({ parentCategory: 1, active: 1, displayOrder: 1 });

export const CategoryModel = registerModel("Category", categorySchema);
