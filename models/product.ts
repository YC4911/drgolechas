import { Schema, Types } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductVariant {
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  packQuantity?: number;
  packUnit?: string;
  priceApproved?: boolean;
  attributes: Map<string, string>;
}

export const PRODUCT_PUBLICATION_STATUSES = [
  "draft",
  "pending_product_verification",
  "pending_pricing_approval",
  "pending_regulatory_review",
  "ready_to_publish",
  "published",
] as const;
export type ProductPublicationStatus =
  (typeof PRODUCT_PUBLICATION_STATUSES)[number];

export interface ProductRecord {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId | null;
  price: number;
  mrp: number;
  discountPercentage: number;
  gst: number;
  stock: number;
  lowStockThreshold: number;
  images: ProductImage[];
  thumbnail: string;
  ingredients: string[];
  benefits: string[];
  howToUse: string;
  storageInstructions?: string;
  safetyInformation?: string;
  regulatoryClassification?: string;
  productDetailsVerified?: boolean;
  priceApproved?: boolean;
  publicationStatus?: ProductPublicationStatus;
  specifications: Map<string, string>;
  tags: string[];
  productType: string;
  useCases: string[];
  preferences: string[];
  variants: ProductVariant[];
  featured: boolean;
  newArrival: boolean;
  active: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const imageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 250 },
  },
  { _id: false },
);

const variantSchema = new Schema<ProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    packQuantity: { type: Number, min: 0 },
    packUnit: { type: String, trim: true, maxlength: 20 },
    priceApproved: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },
    attributes: { type: Map, of: String, default: () => new Map() },
  },
  { _id: false },
);

const productSchema = new Schema<ProductRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    gst: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    images: { type: [imageSchema], default: [] },
    thumbnail: { type: String, required: true, trim: true },
    ingredients: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    howToUse: { type: String, default: "", trim: true },
    storageInstructions: { type: String, trim: true, maxlength: 2000 },
    safetyInformation: { type: String, trim: true, maxlength: 2000 },
    regulatoryClassification: { type: String, trim: true, maxlength: 300 },
    productDetailsVerified: { type: Boolean, default: true },
    priceApproved: { type: Boolean, default: true },
    publicationStatus: {
      type: String,
      enum: PRODUCT_PUBLICATION_STATUSES,
      default: "published",
      required: true,
    },
    specifications: { type: Map, of: String, default: () => new Map() },
    tags: { type: [String], default: [] },
    productType: {
      type: String,
      trim: true,
      lowercase: true,
      default: "general",
      maxlength: 80,
    },
    useCases: { type: [String], default: [] },
    preferences: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    seoTitle: { type: String, trim: true, maxlength: 160 },
    seoDescription: { type: String, trim: true, maxlength: 320 },
    seoKeywords: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ active: 1, featured: 1 });
productSchema.index({ active: 1, newArrival: 1 });
productSchema.index({ active: 1, price: 1 });
productSchema.index({ active: 1, category: 1, createdAt: -1 });
productSchema.index({ active: 1, category: 1, price: 1 });
productSchema.index({ active: 1, category: 1, newArrival: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export const ProductModel = registerModel("Product", productSchema);
