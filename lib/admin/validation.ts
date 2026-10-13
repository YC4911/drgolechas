import { z } from "zod";
import { ORDER_STATUSES } from "@/models/order";
import { PRODUCT_PUBLICATION_STATUSES } from "@/models/product";

const objectId = z.string().regex(/^[\da-f]{24}$/i);
const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value === "" || value.startsWith("/api/uploads/")) return true;
    const parsed = z.url().safeParse(value);
    if (!parsed.success) return false;
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "Provide a valid image URL or upload an image.");

export const adminResourceSchema = z.enum([
  "products",
  "categories",
  "orders",
  "customers",
  "reviews",
  "coupons",
  "testimonials",
  "settings",
  "social",
]);
export type AdminResource = z.infer<typeof adminResourceSchema>;

export const adminListQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum([...ORDER_STATUSES, "approved", "rejected"]).optional(),
    active: z.enum(["true", "false"]).optional(),
    category: objectId.optional(),
    sort: z
      .enum(["newest", "name", "price-asc", "price-desc", "stock-asc"])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();

export const adminImageSchema = z
  .object({
    url: imageUrl,
    alt: z.string().trim().max(250).default(""),
  })
  .strict();

const variantSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sku: z.string().trim().min(1).max(80),
    price: z.coerce.number().finite().min(0),
    mrp: z.coerce.number().finite().min(0),
    stock: z.coerce.number().int().min(0).default(0),
    packQuantity: z.coerce.number().finite().positive().optional(),
    packUnit: z.string().trim().max(20).optional(),
    priceApproved: z.boolean().default(true),
    attributes: z.record(z.string(), z.string()).default({}),
  })
  .strict()
  .refine((variant) => variant.price <= variant.mrp, {
    message: "Variant price cannot exceed MRP.",
    path: ["price"],
  });

const productFields = {
  name: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  sku: z.string().trim().min(1).max(80),
  category: objectId,
  subcategory: objectId.nullable().optional(),
  description: z.string().trim().min(1).max(20_000),
  shortDescription: z.string().trim().min(1).max(320),
  price: z.coerce.number().finite().min(0),
  mrp: z.coerce.number().finite().min(0),
  gst: z.coerce.number().finite().min(0).max(100).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  images: z.array(adminImageSchema).max(20).default([]),
  thumbnail: imageUrl.refine(
    (value) => value.length > 0,
    "A primary product image is required.",
  ),
  ingredients: z.array(z.string().trim().max(300)).max(100).default([]),
  benefits: z.array(z.string().trim().max(300)).max(100).default([]),
  howToUse: z.string().trim().max(5000).default(""),
  specifications: z.record(z.string(), z.string()).default({}),
  tags: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
  productType: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .default("general"),
  useCases: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  preferences: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  storageInstructions: z.string().trim().max(2000).default(""),
  safetyInformation: z.string().trim().max(2000).default(""),
  regulatoryClassification: z.string().trim().max(300).default(""),
  productDetailsVerified: z.boolean().default(true),
  priceApproved: z.boolean().default(true),
  publicationStatus: z.enum(PRODUCT_PUBLICATION_STATUSES).default("published"),
  variants: z.array(variantSchema).max(100).default([]),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  active: z.boolean().default(true),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  seoKeywords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
};

export const adminProductSchema = z
  .object(productFields)
  .strict()
  .refine((product) => product.price <= product.mrp, {
    message: "Selling price cannot exceed MRP.",
    path: ["price"],
  })
  .superRefine((product, context) => {
    if (
      ["published", "ready_to_publish"].includes(product.publicationStatus) &&
      (!product.productDetailsVerified ||
        product.ingredients.length === 0 ||
        !product.howToUse.trim() ||
        !product.storageInstructions.trim() ||
        !product.safetyInformation.trim() ||
        !product.regulatoryClassification.trim() ||
        !product.priceApproved ||
        product.price <= 0 ||
        product.variants.some(
          (variant) =>
            !variant.priceApproved || variant.price <= 0 || variant.mrp <= 0,
        ))
    ) {
      context.addIssue({
        code: "custom",
        path: ["publicationStatus"],
        message:
          "Publishing requires verified ingredients, usage, storage, safety and regulatory details plus approved, positive prices for the product and every variant.",
      });
    }
  });

export const adminProductUpdateSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((product) => Object.keys(product).length > 0, {
    message: "Provide at least one product field.",
  });

export const adminCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().trim().max(1000).default(""),
    image: imageUrl.default(""),
    parentCategory: objectId.nullable().default(null),
    active: z.boolean().default(true),
    displayOrder: z.coerce.number().int().min(0).default(0),
    seoTitle: z.string().trim().max(160).optional(),
    seoDescription: z.string().trim().max(320).optional(),
  })
  .strict();

export const adminCategoryUpdateSchema = adminCategorySchema
  .partial()
  .strict()
  .refine((category) => Object.keys(category).length > 0, {
    message: "Provide at least one category field.",
  });

export const adminOrderUpdateSchema = z
  .object({
    orderStatus: z.enum(ORDER_STATUSES).optional(),
    trackingNumber: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide an order status, tracking number, or note.",
  });

export const adminCustomerUpdateSchema = z
  .object({ active: z.boolean() })
  .strict();

export const adminReviewUpdateSchema = z
  .object({ approved: z.boolean() })
  .strict();

const couponFields = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().finite().positive(),
  minimumCartValue: z.coerce.number().finite().min(0).default(0),
  maximumDiscount: z.coerce.number().finite().positive().optional(),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  applicableProducts: z.array(objectId).default([]),
  applicableCategories: z.array(objectId).default([]),
  active: z.boolean().default(true),
};

function validateCouponRules(
  coupon: {
    startDate?: Date;
    expiryDate?: Date;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
  },
  context: z.RefinementCtx,
) {
  if (
    coupon.startDate &&
    coupon.expiryDate &&
    coupon.startDate >= coupon.expiryDate
  ) {
    context.addIssue({
      code: "custom",
      path: ["expiryDate"],
      message: "Expiry must be after the start date.",
    });
  }
  if (
    coupon.discountType === "percentage" &&
    coupon.discountValue !== undefined &&
    coupon.discountValue > 100
  ) {
    context.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Percentage discounts cannot exceed 100%.",
    });
  }
}

export const adminCouponSchema = z
  .object(couponFields)
  .strict()
  .superRefine(validateCouponRules);

export const adminCouponUpdateSchema = z
  .object(couponFields)
  .partial()
  .strict()
  .superRefine(validateCouponRules)
  .refine((coupon) => Object.keys(coupon).length > 0, {
    message: "Provide at least one coupon field.",
  });

export const adminTestimonialSchema = z
  .object({
    authorName: z.string().trim().min(2).max(120),
    quote: z.string().trim().min(1).max(1000),
    attribution: z.string().trim().max(120).optional(),
    avatar: imageUrl.optional(),
    approved: z.boolean().default(false),
    displayOrder: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const adminTestimonialUpdateSchema = adminTestimonialSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one testimonial field.",
  });

const socialLinkSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value === "") return true;
    const parsed = z.url().safeParse(value);
    if (!parsed.success) return false;
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  });

export const adminSocialSchema = z
  .record(z.string().trim().min(1).max(40), socialLinkSchema)
  .refine((value) => Object.keys(value).length <= 30);

export const adminSettingsSchema = z
  .object({
    logo: imageUrl.optional(),
    storeName: z.string().trim().min(2).max(120).optional(),
    tagline: z.string().trim().max(240).optional(),
    contactInformation: z
      .object({
        phone: z.string().trim().max(32).optional(),
        email: z.string().trim().email().max(254).optional().or(z.literal("")),
        address: z.string().trim().max(1000).optional(),
      })
      .strict()
      .optional(),
    gstInformation: z
      .object({
        gstin: z.string().trim().max(20).optional(),
        legalName: z.string().trim().max(180).optional(),
      })
      .strict()
      .optional(),
    shippingSettings: z
      .object({
        flatRate: z.coerce.number().finite().min(0).optional(),
        freeShippingThreshold: z.coerce.number().finite().min(0).optional(),
        estimatedDays: z.coerce.number().int().min(0).max(90).optional(),
      })
      .strict()
      .optional(),
    taxSettings: z
      .object({
        defaultGst: z.coerce.number().finite().min(0).max(100).optional(),
        pricesIncludeGst: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one store setting.",
  });

export const adminUploadSchema = z.enum(["products", "categories", "settings"]);
