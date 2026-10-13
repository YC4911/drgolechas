import { connectToDatabase } from "@/lib/db/connect";
import { ApiError } from "@/lib/api/errors";
import { createSlug, resolveCategoryReference } from "@/lib/categories/service";
import { CategoryModel } from "@/models/category";
import { ProductModel, type ProductVariant } from "@/models/product";
import type {
  createProductSchema,
  updateProductSchema,
} from "@/lib/products/validation";
import type { z } from "zod";

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

function calculateDiscount(price: number, mrp: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

function assertPublishable(product: {
  publicationStatus?: string;
  productDetailsVerified?: boolean;
  ingredients?: string[];
  howToUse?: string;
  storageInstructions?: string;
  safetyInformation?: string;
  regulatoryClassification?: string;
  priceApproved?: boolean;
  price: number;
  mrp: number;
  variants: ProductVariant[];
}): void {
  if (
    product.publicationStatus !== "published" &&
    product.publicationStatus !== "ready_to_publish"
  ) {
    return;
  }
  if (
    product.productDetailsVerified === false ||
    product.ingredients?.length === 0 ||
    !product.howToUse?.trim() ||
    !product.storageInstructions?.trim() ||
    !product.safetyInformation?.trim() ||
    !product.regulatoryClassification?.trim() ||
    product.priceApproved === false ||
    product.price <= 0 ||
    product.mrp < product.price ||
    product.variants.some(
      (variant) =>
        variant.priceApproved === false ||
        variant.price <= 0 ||
        variant.mrp < variant.price,
    )
  ) {
    throw new ApiError(
      "Publishing requires verified ingredients, usage, storage, safety and regulatory details plus approved, valid prices for the product and every variant.",
      422,
    );
  }
}

function productVariants(
  variants: CreateProductInput["variants"],
): ProductVariant[] {
  return variants.map((variant) => ({
    ...variant,
    attributes: new Map(Object.entries(variant.attributes)),
  }));
}

async function validateCategoryPair(
  categoryId: CreateProductInput["category"] | string,
  subcategoryId: string | null | undefined,
) {
  const category = await resolveCategoryReference(categoryId);
  if (!category) throw new ApiError("An active category is required.", 422);

  if (!subcategoryId) return { category, subcategory: null };

  const subcategory = await resolveCategoryReference(subcategoryId);
  if (!subcategory) {
    throw new ApiError("The selected subcategory is not active.", 422);
  }
  if (subcategory.parentCategory?.toString() !== category._id.toString()) {
    throw new ApiError(
      "The selected subcategory does not belong to the selected category.",
      422,
    );
  }

  return { category, subcategory };
}

export async function createProduct(input: CreateProductInput) {
  await connectToDatabase();
  if (input.price > input.mrp) {
    throw new ApiError("Selling price cannot exceed MRP.", 422);
  }

  const { category, subcategory } = await validateCategoryPair(
    input.category,
    input.subcategory,
  );
  const slug = input.slug ?? createSlug(input.name);
  if (!slug) throw new ApiError("A valid product slug is required.", 422);

  const product = new ProductModel({
    ...input,
    slug,
    sku: input.sku.toUpperCase(),
    category: category._id,
    subcategory: subcategory?._id ?? null,
    discountPercentage: calculateDiscount(input.price, input.mrp),
    images:
      input.images.length > 0
        ? input.images
        : [{ url: input.thumbnail, alt: input.name }],
    specifications: new Map(Object.entries(input.specifications)),
    variants: productVariants(input.variants),
  });

  assertPublishable(product);
  return product.save();
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await connectToDatabase();
  const product = await ProductModel.findById(id).exec();
  if (!product) throw new ApiError("Product not found.", 404);

  const nextPrice = input.price ?? product.price;
  const nextMrp = input.mrp ?? product.mrp;
  if (nextPrice > nextMrp) {
    throw new ApiError("Selling price cannot exceed MRP.", 422);
  }

  const categoryId = input.category
    ? (await resolveCategoryReference(input.category))?._id
    : product.category;
  const subcategoryId =
    input.subcategory === undefined
      ? product.subcategory
      : input.subcategory
        ? (await resolveCategoryReference(input.subcategory))?._id
        : null;

  if (!categoryId) throw new ApiError("An active category is required.", 422);
  if (input.category !== undefined || input.subcategory !== undefined) {
    const [category, subcategory] = await Promise.all([
      CategoryModel.findOne({ _id: categoryId, active: true }).exec(),
      subcategoryId
        ? CategoryModel.findOne({ _id: subcategoryId, active: true }).exec()
        : Promise.resolve(null),
    ]);

    if (!category) throw new ApiError("An active category is required.", 422);
    if (subcategoryId && !subcategory) {
      throw new ApiError("The selected subcategory is not active.", 422);
    }
    if (
      subcategory &&
      subcategory.parentCategory?.toString() !== category._id.toString()
    ) {
      throw new ApiError(
        "The selected subcategory does not belong to the selected category.",
        422,
      );
    }
  }

  const scalarFields = { ...input };
  delete scalarFields.category;
  delete scalarFields.subcategory;
  delete scalarFields.specifications;
  delete scalarFields.variants;

  Object.assign(product, scalarFields);
  if (input.category !== undefined) product.category = categoryId;
  if (input.subcategory !== undefined) product.subcategory = subcategoryId;
  if (input.sku !== undefined) product.sku = input.sku.toUpperCase();
  if (input.specifications !== undefined) {
    product.specifications = new Map(Object.entries(input.specifications));
  }
  if (input.variants !== undefined) {
    product.variants = productVariants(input.variants);
  }
  product.discountPercentage = calculateDiscount(nextPrice, nextMrp);

  assertPublishable(product);
  return product.save();
}

export async function deactivateProduct(id: string) {
  await connectToDatabase();
  const product = await ProductModel.findById(id).exec();
  if (!product) throw new ApiError("Product not found.", 404);
  product.active = false;
  await product.save();
  return product;
}
