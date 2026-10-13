import { Types, type PipelineStage } from "mongoose";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db/connect";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";
import { ReviewModel } from "@/models/review";
import type { ProductFilters } from "@/lib/products/validation";
import type { ProductImage, ProductVariant } from "@/models/product";

interface CategoryLookup {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentCategory: Types.ObjectId | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  category: { id: string; name: string; slug: string } | null;
  subcategory: { id: string; name: string; slug: string } | null;
  price: number;
  mrp: number;
  discountPercentage: number;
  stock: number;
  variants: Array<
    Pick<
      ProductVariant,
      | "name"
      | "sku"
      | "price"
      | "mrp"
      | "stock"
      | "packQuantity"
      | "packUnit"
      | "priceApproved"
    >
  >;
  priceApproved: boolean;
  publicationStatus: string;
  productDetailsVerified: boolean;
  purchasable: boolean;
  thumbnail: string;
  images: ProductImage[];
  featured: boolean;
  newArrival: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  ingredients: string[];
  benefits: string[];
  howToUse: string;
  specifications: Record<string, string>;
  variants: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  storageInstructions: string;
  safetyInformation: string;
  regulatoryClassification: string;
}

export interface ProductPageResult {
  products: ProductListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    pageSize: number;
  };
}

interface ProductAggregate extends Record<string, unknown> {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  category: Types.ObjectId;
  subcategory: Types.ObjectId | null;
  price: number;
  mrp: number;
  discountPercentage: number;
  stock: number;
  variants: ProductVariant[];
  publicationStatus?: string;
  priceApproved?: boolean;
  productDetailsVerified?: boolean;
  active?: boolean;
  thumbnail: string;
  images: ProductImage[];
  featured: boolean;
  newArrival: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCategoryTreeIds(
  rootId: Types.ObjectId,
  categories: CategoryLookup[],
): Types.ObjectId[] {
  const ids = new Set([rootId.toString()]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const category of categories) {
      if (
        category.parentCategory &&
        ids.has(category.parentCategory.toString()) &&
        !ids.has(category._id.toString())
      ) {
        ids.add(category._id.toString());
        changed = true;
      }
    }
  }

  return categories
    .filter((category) => ids.has(category._id.toString()))
    .map((category) => category._id);
}

function makeCategoryMap(categories: CategoryLookup[]) {
  return new Map(
    categories.map((category) => [category._id.toString(), category]),
  );
}

function toCategorySummary(
  id: Types.ObjectId | null | undefined,
  categories: Map<string, CategoryLookup>,
) {
  if (!id) return null;
  const category = categories.get(id.toString());
  return category
    ? { id: category._id.toString(), name: category.name, slug: category.slug }
    : null;
}

function toStringRecord(value: unknown): Record<string, string> {
  const entries =
    value instanceof Map
      ? [...value.entries()]
      : value && typeof value === "object"
        ? Object.entries(value)
        : [];

  return Object.fromEntries(
    entries.filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function toListItem(
  product: ProductAggregate,
  categories: Map<string, CategoryLookup>,
): ProductListItem {
  const publicationStatus = product.publicationStatus ?? "published";
  const priceApproved =
    product.priceApproved !== false &&
    (product.variants ?? [])[0]?.priceApproved !== false;
  const purchasable =
    product.active !== false &&
    publicationStatus === "published" &&
    priceApproved &&
    product.productDetailsVerified !== false &&
    (product.variants ?? []).every(
      (variant) => variant.priceApproved !== false,
    );
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    category: toCategorySummary(product.category, categories),
    subcategory: toCategorySummary(product.subcategory, categories),
    price: priceApproved ? product.price : 0,
    mrp: priceApproved ? product.mrp : 0,
    discountPercentage: priceApproved ? product.discountPercentage : 0,
    stock: product.stock,
    variants: (product.variants ?? []).map(
      ({
        name,
        sku,
        price,
        mrp,
        stock,
        packQuantity,
        packUnit,
        priceApproved,
      }) => ({
        name,
        sku,
        price:
          product.priceApproved !== false && priceApproved !== false
            ? price
            : 0,
        mrp:
          product.priceApproved !== false && priceApproved !== false ? mrp : 0,
        stock,
        packQuantity,
        packUnit,
        priceApproved: priceApproved !== false,
      }),
    ),
    priceApproved,
    publicationStatus,
    productDetailsVerified: product.productDetailsVerified !== false,
    purchasable,
    thumbnail: product.thumbnail,
    images: product.images ?? [],
    featured: product.featured,
    newArrival: product.newArrival,
    rating: product.rating,
    reviewCount: product.reviewCount,
    createdAt: product.createdAt?.toISOString() ?? "",
  };
}

function getSortStage(sort: ProductFilters["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "price-low":
      return { price: 1, _id: -1 };
    case "price-high":
      return { price: -1, _id: -1 };
    case "rating":
      return { rating: -1, reviewCount: -1, _id: -1 };
    case "featured":
      return { featured: -1, createdAt: -1, _id: -1 };
    default:
      return { createdAt: -1, _id: -1 };
  }
}

function isObjectId(value: string): boolean {
  return /^[\da-f]{24}$/i.test(value);
}

export async function listProducts(
  filters: ProductFilters,
  options: { excludeProductId?: Types.ObjectId } = {},
): Promise<ProductPageResult> {
  await connectToDatabase();

  const activeCategories = await CategoryModel.find({ active: true })
    .select("_id name slug parentCategory")
    .lean()
    .exec();
  const categoryMap = makeCategoryMap(activeCategories);
  const activeCategoryIds = activeCategories.map(({ _id }) => _id);

  if (activeCategoryIds.length === 0) {
    return {
      products: [],
      pagination: {
        currentPage: filters.page,
        totalPages: 0,
        totalProducts: 0,
        pageSize: filters.pageSize,
      },
    };
  }

  const clauses: Record<string, unknown>[] = [
    { active: true },
    { category: { $in: activeCategoryIds } },
    {
      $or: [{ subcategory: null }, { subcategory: { $in: activeCategoryIds } }],
    },
  ];

  if (options.excludeProductId) {
    clauses.push({ _id: { $ne: options.excludeProductId } });
  }

  if (filters.category) {
    const category = isObjectId(filters.category)
      ? activeCategories.find(
          ({ _id }) => _id.toString() === filters.category?.toLowerCase(),
        )
      : activeCategories.find(
          ({ slug }) => slug === filters.category?.toLowerCase(),
        );
    const categoryIds = category
      ? getCategoryTreeIds(category._id, activeCategories)
      : [];
    clauses.push({
      $or: [
        { category: { $in: categoryIds } },
        { subcategory: { $in: categoryIds } },
      ],
    });
  }

  if (filters.subcategory) {
    const subcategory = isObjectId(filters.subcategory)
      ? activeCategories.find(
          ({ _id }) => _id.toString() === filters.subcategory?.toLowerCase(),
        )
      : activeCategories.find(
          ({ slug }) => slug === filters.subcategory?.toLowerCase(),
        );
    clauses.push({
      subcategory: subcategory?._id ?? { $in: [] },
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (filters.minPrice !== undefined) price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) price.$lte = filters.maxPrice;
    clauses.push({ price });
  }

  if (filters.availability === "in-stock") clauses.push({ stock: { $gt: 0 } });
  if (filters.availability === "out-of-stock") {
    clauses.push({ stock: { $lte: 0 } });
  }
  if (filters.newArrival !== undefined) {
    clauses.push({ newArrival: filters.newArrival });
  }
  if (filters.featured !== undefined) {
    clauses.push({ featured: filters.featured });
  }
  if (filters.tags.length > 0) {
    clauses.push({ tags: { $in: filters.tags } });
  }

  const pipeline: PipelineStage[] = [];

  if (filters.q) {
    const keywordFallback = filters.q
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => {
        const pattern = new RegExp(escapeRegex(term), "i");
        const matchingCategoryIds = activeCategories
          .filter(({ name, slug }) => pattern.test(name) || pattern.test(slug))
          .map(({ _id }) => _id);

        return {
          $or: [
            { sku: term.toUpperCase() },
            { sku: pattern },
            { name: pattern },
            { description: pattern },
            { shortDescription: pattern },
            { tags: pattern },
            { category: { $in: matchingCategoryIds } },
            { subcategory: { $in: matchingCategoryIds } },
          ],
        };
      });

    pipeline.push(
      { $match: { $text: { $search: filters.q }, $and: clauses } },
      {
        $unionWith: {
          coll: ProductModel.collection.name,
          pipeline: [{ $match: { $and: [...clauses, ...keywordFallback] } }],
        },
      },
      { $group: { _id: "$_id", product: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$product" } },
    );
  } else {
    pipeline.push({ $match: { $and: clauses } });
  }

  pipeline.push(
    {
      $lookup: {
        from: ReviewModel.collection.name,
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$product", "$$productId"] },
                  { $eq: ["$approved", true] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              rating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ],
        as: "reviewStats",
      },
    },
    {
      $set: {
        rating: {
          $ifNull: [{ $arrayElemAt: ["$reviewStats.rating", 0] }, 0],
        },
        reviewCount: {
          $ifNull: [{ $arrayElemAt: ["$reviewStats.reviewCount", 0] }, 0],
        },
      },
    },
  );

  if (filters.rating !== undefined) {
    pipeline.push({ $match: { rating: { $gte: filters.rating } } });
  }

  pipeline.push({
    $facet: {
      products: [
        { $sort: getSortStage(filters.sort) },
        { $skip: (filters.page - 1) * filters.pageSize },
        { $limit: filters.pageSize },
        {
          $project: {
            name: 1,
            slug: 1,
            sku: 1,
            shortDescription: 1,
            category: 1,
            subcategory: 1,
            price: 1,
            mrp: 1,
            discountPercentage: 1,
            stock: 1,
            variants: 1,
            priceApproved: 1,
            publicationStatus: 1,
            productDetailsVerified: 1,
            active: 1,
            thumbnail: 1,
            images: 1,
            featured: 1,
            newArrival: 1,
            rating: 1,
            reviewCount: 1,
            createdAt: 1,
          },
        },
      ],
      metadata: [{ $count: "totalProducts" }],
    },
  });

  const [result] = await ProductModel.aggregate<{
    products: ProductAggregate[];
    metadata: { totalProducts: number }[];
  }>(pipeline).exec();
  const products = result?.products ?? [];
  const totalProducts = result?.metadata[0]?.totalProducts ?? 0;
  const totalPages = Math.ceil(totalProducts / filters.pageSize);

  if (filters.page > Math.max(totalPages, 1)) {
    return listProducts({ ...filters, page: Math.max(totalPages, 1) }, options);
  }

  return {
    products: products.map((product) => toListItem(product, categoryMap)),
    pagination: {
      currentPage: filters.page,
      totalPages,
      totalProducts,
      pageSize: filters.pageSize,
    },
  };
}

async function getProductDetail(
  lookup: { _id: Types.ObjectId } | { slug: string },
): Promise<ProductDetail | null> {
  await connectToDatabase();
  const product = await ProductModel.findOne({ ...lookup, active: true })
    .lean()
    .exec();

  if (!product) return null;

  const [category, subcategory, ratingStats] = await Promise.all([
    CategoryModel.findOne({ _id: product.category, active: true })
      .select("_id name slug")
      .lean()
      .exec(),
    product.subcategory
      ? CategoryModel.findOne({ _id: product.subcategory, active: true })
          .select("_id name slug")
          .lean()
          .exec()
      : Promise.resolve(null),
    ReviewModel.aggregate<{ rating: number; reviewCount: number }>([
      { $match: { product: product._id, approved: true } },
      {
        $group: {
          _id: null,
          rating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]).exec(),
  ]);

  if (!category || (product.subcategory && !subcategory)) return null;

  const specs = toStringRecord(product.specifications);
  const stats = ratingStats[0];

  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    category: {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
    },
    subcategory: subcategory
      ? {
          id: subcategory._id.toString(),
          name: subcategory.name,
          slug: subcategory.slug,
        }
      : null,
    price:
      product.priceApproved !== false &&
      product.variants[0]?.priceApproved !== false
        ? product.price
        : 0,
    mrp:
      product.priceApproved !== false &&
      product.variants[0]?.priceApproved !== false
        ? product.mrp
        : 0,
    discountPercentage: product.discountPercentage,
    stock: product.stock,
    thumbnail: product.thumbnail,
    images: product.images,
    featured: product.featured,
    newArrival: product.newArrival,
    rating: stats?.rating ?? 0,
    reviewCount: stats?.reviewCount ?? 0,
    createdAt: product.createdAt?.toISOString() ?? "",
    description: product.description,
    ingredients: product.ingredients,
    benefits: product.benefits,
    howToUse: product.howToUse,
    storageInstructions: product.storageInstructions ?? "",
    safetyInformation: product.safetyInformation ?? "",
    regulatoryClassification: product.regulatoryClassification ?? "",
    priceApproved:
      product.priceApproved !== false &&
      product.variants[0]?.priceApproved !== false,
    publicationStatus: product.publicationStatus ?? "published",
    productDetailsVerified: product.productDetailsVerified !== false,
    purchasable:
      product.active !== false &&
      (product.publicationStatus ?? "published") === "published" &&
      product.priceApproved !== false &&
      product.productDetailsVerified !== false &&
      (product.variants ?? []).every(
        (variant) => variant.priceApproved !== false,
      ),
    specifications: specs,
    variants: product.variants.map((variant) => ({
      ...variant,
      price:
        product.priceApproved !== false && variant.priceApproved !== false
          ? variant.price
          : 0,
      mrp:
        product.priceApproved !== false && variant.priceApproved !== false
          ? variant.mrp
          : 0,
    })),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords ?? [],
  };
}

export async function getProductById(
  id: string,
): Promise<ProductDetail | null> {
  if (!isObjectId(id)) return null;
  return getProductDetail({ _id: new Types.ObjectId(id) });
}

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    return getProductDetail({ slug: slug.toLowerCase() });
  },
);

export async function getRelatedProducts(
  product: ProductDetail,
): Promise<ProductListItem[]> {
  if (!product.category) return [];

  const parsed = {
    q: undefined,
    category: product.category.slug,
    subcategory: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
    availability: "all",
    newArrival: undefined,
    featured: undefined,
    tags: [],
    sort: "featured",
    page: 1,
    pageSize: 4,
  } satisfies ProductFilters;

  const result = await listProducts(parsed, {
    excludeProductId: new Types.ObjectId(product.id),
  });
  return result.products;
}
