import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db/connect";
import { absoluteUrl } from "@/lib/seo/site-url";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";

export const dynamic = "force-dynamic";

const staticRoutes = [
  "/",
  "/shop",
  "/new-arrivals",
  "/product-finder",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/terms-of-conscious-service",
  "/shipping-policy",
  "/returns",
  "/cancellation-policy",
  "/disclaimer",
  "/health-disclaimer",
];
const maxSitemapEntries = 50_000;
const categoryLimit = 2_000;
const productLimit = maxSitemapEntries - staticRoutes.length - categoryLimit;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixedRoutes = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : 0.6,
  }));

  if (!process.env.MONGODB_URI?.trim()) return fixedRoutes;

  await connectToDatabase();
  const [products, categories] = await Promise.all([
    ProductModel.find({
      active: true,
      priceApproved: { $ne: false },
      $or: [
        { publicationStatus: "published" },
        { publicationStatus: { $exists: false } },
      ],
      variants: { $not: { $elemMatch: { priceApproved: false } } },
    })
      .select("slug updatedAt")
      .sort({ _id: 1 })
      .limit(productLimit)
      .lean()
      .exec(),
    CategoryModel.find({ active: true })
      .select("slug updatedAt")
      .sort({ _id: 1 })
      .limit(categoryLimit)
      .lean()
      .exec(),
  ]);

  return [
    ...fixedRoutes,
    ...categories.map((category) => ({
      url: absoluteUrl(`/shop/${encodeURIComponent(category.slug)}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
