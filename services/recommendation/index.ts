import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { CategoryModel } from "@/models/category";
import { InventoryModel } from "@/models/inventory";
import { ProductModel } from "@/models/product";
import { ReviewModel } from "@/models/review";
import { demoCategories } from "@/lib/demo-data";
import { deterministicRecommendationProvider } from "@/services/recommendation/deterministic";
import type {
  FinderAnswers,
  FinderCategory,
  RecommendationProduct,
  RecommendationProvider,
  RecommendedProduct,
} from "@/services/recommendation/types";

const maxCandidateCount = 1000;

export const finderAnswersSchema = z
  .object({
    shoppingFor: z.string().trim().min(1).max(80),
    category: z.string().trim().max(120).nullable(),
    productType: z.string().trim().max(80).nullable(),
    preferences: z.array(z.string().trim().min(1).max(80)).max(10),
    maximumPrice: z.number().finite().min(0).max(1_000_000).nullable(),
    inStockOnly: z.boolean(),
  })
  .strict();

export async function getFinderOptions(): Promise<{
  categories: FinderCategory[];
  formats: string[];
  preferences: string[];
}> {
  if (!process.env.MONGODB_URI?.trim()) {
    return {
      categories: demoCategories.map(({ name, slug }) => ({ name, slug })),
      formats: [],
      preferences: [],
    };
  }
  await connectToDatabase();
  const categories = await CategoryModel.find({ active: true })
    .select("_id name slug")
    .sort({ displayOrder: 1, name: 1 })
    .lean()
    .exec();
  const products =
    categories.length > 0
      ? await ProductModel.find({
          active: true,
          priceApproved: { $ne: false },
          $or: [
            { publicationStatus: "published" },
            { publicationStatus: { $exists: false } },
          ],
          variants: { $not: { $elemMatch: { priceApproved: false } } },
          category: { $in: categories.map(({ _id }) => _id) },
        })
          .select("productType tags preferences")
          .limit(maxCandidateCount)
          .lean()
          .exec()
      : [];
  return {
    categories: categories.map(({ name, slug }) => ({ name, slug })),
    formats: [
      ...new Set(
        products.map((product) => product.productType).filter(Boolean),
      ),
    ].sort(),
    preferences: [
      ...new Set(
        products.flatMap((product) => [
          ...(product.preferences ?? []),
          ...(product.tags ?? []),
        ]),
      ),
    ]
      .filter(Boolean)
      .sort(),
  };
}

async function getActiveProducts(): Promise<RecommendationProduct[]> {
  if (!process.env.MONGODB_URI?.trim()) return [];
  await connectToDatabase();
  const categories = await CategoryModel.find({ active: true })
    .select("_id name slug parentCategory")
    .lean()
    .exec();
  const categoryMap = new Map(
    categories.map((category) => [category._id.toString(), category]),
  );
  if (categories.length === 0) return [];

  const products = await ProductModel.find({
    active: true,
    priceApproved: { $ne: false },
    $or: [
      { publicationStatus: "published" },
      { publicationStatus: { $exists: false } },
    ],
    variants: { $not: { $elemMatch: { priceApproved: false } } },
    category: { $in: categories.map(({ _id }) => _id) },
  })
    .select(
      "name slug sku shortDescription category subcategory price mrp discountPercentage stock thumbnail images variants tags productType useCases preferences newArrival",
    )
    .sort({ newArrival: -1, createdAt: -1 })
    .limit(maxCandidateCount)
    .lean()
    .exec();
  const inventories = await InventoryModel.find({
    product: { $in: products.map(({ _id }) => _id) },
  })
    .select("product quantity reserved")
    .lean()
    .exec();
  const availableByProduct = new Map(
    inventories.map((inventory) => [
      inventory.product.toString(),
      Math.max(0, inventory.quantity - inventory.reserved),
    ]),
  );

  return products.flatMap((product) => {
    const category = categoryMap.get(product.category.toString());
    if (!category) return [];
    const subcategory = product.subcategory
      ? categoryMap.get(product.subcategory.toString())
      : undefined;
    const inventoryStock =
      availableByProduct.get(product._id.toString()) ?? product.stock;
    const variants = (product.variants ?? []).map(
      ({ name, sku, price, mrp, stock }) => ({
        name,
        sku,
        price,
        mrp,
        stock: availableByProduct.has(product._id.toString())
          ? Math.min(stock, inventoryStock)
          : stock,
      }),
    );
    return [
      {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        shortDescription: product.shortDescription,
        category: { name: category.name, slug: category.slug },
        subcategory: subcategory
          ? { name: subcategory.name, slug: subcategory.slug }
          : null,
        price: product.price,
        mrp: product.mrp,
        discountPercentage: product.discountPercentage,
        stock:
          variants.length > 0
            ? Math.max(...variants.map(({ stock }) => stock))
            : inventoryStock,
        thumbnail: product.thumbnail,
        images: product.images ?? [],
        variants,
        rating: 0,
        reviewCount: 0,
        productType: product.productType ?? "general",
        tags: product.tags ?? [],
        useCases: product.useCases ?? [],
        preferences: product.preferences ?? [],
        newArrival: product.newArrival,
      },
    ];
  });
}

export async function recommendProducts(
  answers: FinderAnswers,
  provider: RecommendationProvider = deterministicRecommendationProvider,
): Promise<RecommendedProduct[]> {
  const products = await getActiveProducts();
  if (products.length === 0) return [];
  const productIds = products.map(({ id }) => new Types.ObjectId(id));
  const ratingRows = await ReviewModel.aggregate<{
    _id: Types.ObjectId;
    rating: number;
    reviewCount: number;
  }>([
    { $match: { product: { $in: productIds }, approved: true } },
    {
      $group: {
        _id: "$product",
        rating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]).exec();
  const ratings = new Map(
    ratingRows.map((row) => [
      row._id.toString(),
      { rating: row.rating, reviewCount: row.reviewCount },
    ]),
  );
  const productsWithRatings = products.map((product) => ({
    ...product,
    ...(ratings.get(product.id) ?? { rating: 0, reviewCount: 0 }),
  }));
  return provider.recommend(productsWithRatings, answers);
}
