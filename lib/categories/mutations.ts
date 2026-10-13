import { connectToDatabase } from "@/lib/db/connect";
import { ApiError } from "@/lib/api/errors";
import {
  createSlug,
  findCategoryByKey,
  resolveCategoryReference,
  wouldCreateCategoryCycle,
} from "@/lib/categories/service";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";
import type {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/products/validation";
import type { z } from "zod";

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export async function createCategory(input: CreateCategoryInput) {
  await connectToDatabase();
  const slug = input.slug ?? createSlug(input.name);
  if (!slug) throw new ApiError("A valid category slug is required.", 422);

  const parentCategory = input.parentCategory
    ? await resolveCategoryReference(input.parentCategory)
    : null;
  if (input.parentCategory && !parentCategory) {
    throw new ApiError("The selected parent category is not active.", 422);
  }

  return new CategoryModel({
    ...input,
    slug,
    parentCategory: parentCategory?._id ?? null,
  }).save();
}

export async function updateCategory(key: string, input: UpdateCategoryInput) {
  await connectToDatabase();
  const category = await findCategoryByKey(key, true);
  if (!category) throw new ApiError("Category not found.", 404);

  let parentId = category.parentCategory;
  if (input.parentCategory !== undefined) {
    const parent = input.parentCategory
      ? await resolveCategoryReference(input.parentCategory)
      : null;
    if (input.parentCategory && !parent) {
      throw new ApiError("The selected parent category is not active.", 422);
    }

    if (
      parent &&
      (parent._id.equals(category._id) ||
        (await wouldCreateCategoryCycle(category._id, parent._id)))
    ) {
      throw new ApiError("Category nesting cannot contain a cycle.", 422);
    }
    parentId = parent?._id ?? null;
  }

  const scalarFields = { ...input };
  delete scalarFields.parentCategory;
  Object.assign(category, scalarFields);
  category.parentCategory = parentId;
  if (input.name && input.slug === undefined) {
    const generatedSlug = createSlug(input.name);
    if (generatedSlug) category.slug = generatedSlug;
  }

  return category.save();
}

export async function deactivateCategory(key: string) {
  await connectToDatabase();
  const category = await findCategoryByKey(key, true);
  if (!category) throw new ApiError("Category not found.", 404);
  if (!category.active) return category;

  const [activeProducts, activeChildren] = await Promise.all([
    ProductModel.countDocuments({
      active: true,
      $or: [{ category: category._id }, { subcategory: category._id }],
    }),
    CategoryModel.countDocuments({
      parentCategory: category._id,
      active: true,
    }),
  ]);

  if (activeProducts > 0 || activeChildren > 0) {
    throw new ApiError(
      "Reassign or deactivate active products and child categories first.",
      409,
    );
  }

  category.active = false;
  return category.save();
}
