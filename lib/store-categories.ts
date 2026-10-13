import { connectToDatabase } from "@/lib/db/connect";
import { demoCategories } from "@/lib/demo-data";
import { CategoryModel } from "@/models/category";
import type { StoreCategory } from "@/types/category";

function getDemoCategories(): StoreCategory[] {
  return demoCategories.map(({ name, slug, description, image }) => ({
    name,
    slug,
    description,
    image,
    parentCategoryId: null,
  }));
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  if (!process.env.MONGODB_URI?.trim()) {
    return getDemoCategories();
  }

  try {
    await connectToDatabase();
    const categories = await CategoryModel.find({
      active: true,
      parentCategory: null,
    })
      .sort({ displayOrder: 1, name: 1 })
      .select("name slug description image")
      .lean()
      .exec();

    if (categories.length === 0) {
      return getDemoCategories();
    }

    return categories.map(({ name, slug, description, image }) => ({
      name,
      slug,
      description,
      image,
      parentCategoryId: null,
    }));
  } catch {
    return getDemoCategories();
  }
}

export async function getAllStoreCategories(): Promise<StoreCategory[]> {
  if (!process.env.MONGODB_URI?.trim()) {
    return getDemoCategories();
  }

  try {
    await connectToDatabase();
    const categories = await CategoryModel.find({ active: true })
      .sort({ displayOrder: 1, name: 1 })
      .select("name slug description image parentCategory")
      .lean()
      .exec();

    if (categories.length === 0) return getDemoCategories();

    return categories.map(
      ({ name, slug, description, image, parentCategory }) => ({
        name,
        slug,
        description,
        image,
        parentCategoryId: parentCategory?.toString() ?? null,
      }),
    );
  } catch {
    return getDemoCategories();
  }
}
