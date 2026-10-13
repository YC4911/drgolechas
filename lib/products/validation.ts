import { z } from "zod";

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
const optionalBooleanQuery = z.preprocess(
  (value) => (value === "" ? undefined : value),
  booleanQuery.optional(),
);
const optionalPriceQuery = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().finite().min(0).optional(),
);
const optionalRatingQuery = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().finite().min(1).max(5).optional(),
);
const categoryQuery = z
  .string()
  .trim()
  .max(120)
  .refine(
    (value) =>
      value === "" ||
      /^[\da-f]{24}$/i.test(value) ||
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value),
    "Use a category slug or MongoDB ID.",
  )
  .optional();

export const productFilterSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: categoryQuery,
    subcategory: categoryQuery,
    minPrice: optionalPriceQuery,
    maxPrice: optionalPriceQuery,
    rating: optionalRatingQuery,
    availability: z.enum(["all", "in-stock", "out-of-stock"]).default("all"),
    newArrival: optionalBooleanQuery,
    featured: optionalBooleanQuery,
    tags: z
      .string()
      .trim()
      .max(300)
      .optional()
      .transform((value) =>
        value
          ? [
              ...new Set(
                value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              ),
            ]
          : [],
      ),
    sort: z
      .enum(["newest", "price-low", "price-high", "rating", "featured"])
      .default("newest"),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
  })
  .strict()
  .superRefine((filters, context) => {
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      context.addIssue({
        code: "custom",
        message: "minPrice must be less than or equal to maxPrice.",
        path: ["minPrice"],
      });
    }
  });

export type ProductFilters = z.infer<typeof productFilterSchema>;

export function parseProductFilters(params: URLSearchParams) {
  return productFilterSchema.safeParse(Object.fromEntries(params.entries()));
}

export function searchParamsFromRecord(
  values: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
    else if (value) params.set(key, value.join(","));
  }
  return params;
}

const adminImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("/api/uploads/") || z.url().safeParse(value).success,
    "Provide a valid image URL or upload an image.",
  );

const productImageSchema = z
  .object({
    url: adminImageUrl,
    alt: z.string().trim().max(250).default(""),
  })
  .strict();

const productVariantSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sku: z.string().trim().min(1).max(80),
    price: z.number().finite().min(0),
    mrp: z.number().finite().min(0),
    stock: z.number().int().min(0).default(0),
    attributes: z.record(z.string(), z.string()).default({}),
  })
  .strict()
  .refine((variant) => variant.price <= variant.mrp, {
    message: "Variant selling price cannot exceed MRP.",
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
  category: z.string().trim().min(1).max(120),
  subcategory: z.string().trim().min(1).max(120).nullable().optional(),
  description: z.string().trim().min(1).max(20_000),
  shortDescription: z.string().trim().min(1).max(320),
  price: z.number().finite().min(0),
  mrp: z.number().finite().min(0),
  gst: z.number().finite().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  images: z.array(productImageSchema).max(20).default([]),
  thumbnail: adminImageUrl,
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
  variants: z.array(productVariantSchema).max(100).default([]),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  active: z.boolean().default(true),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  seoKeywords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
};

export const createProductSchema = z.object(productFields).strict();

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((values) => Object.keys(values).length > 0, {
    message: "At least one product field must be provided.",
  });

const categoryFields = {
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(1000).default(""),
  image: adminImageUrl.or(z.literal("")).default(""),
  parentCategory: z.string().trim().min(1).max(120).nullable().default(null),
  active: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
};

export const createCategorySchema = z.object(categoryFields).strict();

export const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .strict()
  .refine((values) => Object.keys(values).length > 0, {
    message: "At least one category field must be provided.",
  });
