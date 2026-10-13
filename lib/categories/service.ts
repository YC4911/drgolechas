import { Types } from "mongoose";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db/connect";
import { CategoryModel, type CategoryRecord } from "@/models/category";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryDto extends CategorySummary {
  description: string;
  image: string;
  parentCategoryId: string | null;
  active: boolean;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  children: CategoryDto[];
}

type LeanCategory = CategoryRecord & { _id: Types.ObjectId };

function toDto(category: LeanCategory): CategoryDto {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    parentCategoryId: category.parentCategory?.toString() ?? null,
    active: category.active,
    displayOrder: category.displayOrder,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    children: [],
  };
}

export function isObjectId(value: string): boolean {
  return /^[\da-f]{24}$/i.test(value);
}

export function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listCategories(
  includeInactive = false,
): Promise<CategoryDto[]> {
  await connectToDatabase();
  const filter = includeInactive ? {} : { active: true };
  const categories = await CategoryModel.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .lean()
    .exec();
  return categories.map(toDto);
}

export function nestCategories(categories: CategoryDto[]): CategoryDto[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const roots: CategoryDto[] = [];

  for (const category of categories) {
    const parent = category.parentCategoryId
      ? byId.get(category.parentCategoryId)
      : undefined;
    if (parent && parent.id !== category.id) parent.children.push(category);
    else roots.push(category);
  }

  return roots;
}

export const findCategoryByKey = cache(
  async (key: string, includeInactive = false) => {
    await connectToDatabase();
    const identity = isObjectId(key)
      ? { _id: key }
      : { slug: key.toLowerCase() };
    return CategoryModel.findOne({
      ...identity,
      ...(includeInactive ? {} : { active: true }),
    }).exec();
  },
);

export async function resolveCategoryReference(value: string) {
  return findCategoryByKey(value);
}

export async function wouldCreateCategoryCycle(
  categoryId: Types.ObjectId,
  parentId: Types.ObjectId,
): Promise<boolean> {
  let currentId: Types.ObjectId | null = parentId;
  const visited = new Set<string>();

  for (let depth = 0; currentId && depth < 100; depth += 1) {
    const id = currentId.toString();
    if (id === categoryId.toString() || visited.has(id)) return true;
    visited.add(id);

    const parent = await CategoryModel.findById(currentId)
      .select("parentCategory")
      .lean()
      .exec();
    currentId = parent?.parentCategory ?? null;
  }

  return currentId !== null;
}
