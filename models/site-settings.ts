import { Schema } from "mongoose";
import { registerModel } from "@/models/register-model";

export interface SiteSettingsRecord {
  key: string;
  logo: string;
  storeName: string;
  tagline: string;
  contactInformation: {
    phone: string;
    email: string;
    address: string;
  };
  gstInformation: {
    gstin: string;
    legalName: string;
  };
  socialLinks: Map<string, string>;
  shippingSettings: {
    flatRate: number;
    freeShippingThreshold: number;
    estimatedDays: number;
  };
  taxSettings: {
    defaultGst: number;
    pricesIncludeGst: boolean;
  };
  homepageConfiguration: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const siteSettingsSchema = new Schema<SiteSettingsRecord>(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    logo: { type: String, default: "" },
    storeName: { type: String, default: "Dr. Golechas", trim: true },
    tagline: { type: String, default: "", trim: true },
    contactInformation: {
      phone: { type: String, default: "", trim: true },
      email: { type: String, default: "", lowercase: true, trim: true },
      address: { type: String, default: "", trim: true },
    },
    gstInformation: {
      gstin: { type: String, default: "", uppercase: true, trim: true },
      legalName: { type: String, default: "", trim: true },
    },
    socialLinks: { type: Map, of: String, default: () => new Map() },
    shippingSettings: {
      flatRate: { type: Number, default: 0, min: 0 },
      freeShippingThreshold: { type: Number, default: 0, min: 0 },
      estimatedDays: { type: Number, default: 0, min: 0 },
    },
    taxSettings: {
      defaultGst: { type: Number, default: 0, min: 0, max: 100 },
      pricesIncludeGst: { type: Boolean, default: false },
    },
    homepageConfiguration: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

export const SiteSettingsModel = registerModel(
  "SiteSettings",
  siteSettingsSchema,
);
