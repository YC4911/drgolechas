import { connectToDatabase } from "@/lib/db/connect";
import { featuredProducts, newArrivals } from "@/lib/mock-products";
import { listProducts } from "@/lib/products/service";
import type { ProductFilters } from "@/lib/products/validation";
import type { Product } from "@/types/product";
import { ReviewModel } from "@/models/review";
import { TestimonialModel } from "@/models/testimonial";

export interface HomepageProduct {
  product: Product;
  href?: string;
}

export interface HomepageReview {
  id: string;
  title: string;
  comment: string;
  rating: number;
  verifiedPurchase: boolean;
  reviewer: string;
  productName: string;
}

export interface HomepageTestimonial {
  id: string;
  authorName: string;
  quote: string;
  attribution: string;
}

const defaultFilters = {
  q: undefined,
  category: undefined,
  subcategory: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  rating: undefined,
  availability: "all",
  newArrival: undefined,
  featured: undefined,
  tags: [],
  sort: "newest",
  page: 1,
  pageSize: 4,
} satisfies ProductFilters;

function mockCards(products: Product[]): HomepageProduct[] {
  return products.map((product) => ({ product }));
}

function productCards(
  products: Awaited<ReturnType<typeof listProducts>>["products"],
): HomepageProduct[] {
  return products.map((item) => ({
    href: `/product/${encodeURIComponent(item.slug)}`,
    product: {
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category?.name ?? "Collection",
      image: item.thumbnail,
      imageAlt: item.images[0]?.alt || item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      mrp: item.mrp,
      sellingPrice: item.price,
      stock: item.stock,
      priceApproved: item.priceApproved,
      availableForSale: item.purchasable,
      publicationStatus: item.publicationStatus,
      cartEnabled: item.purchasable,
      variants: item.variants,
      badge: item.newArrival ? "New" : undefined,
    },
  }));
}

export async function getHomepageContent(): Promise<{
  featured: HomepageProduct[];
  newArrivals: HomepageProduct[];
  reviews: HomepageReview[];
  testimonials: HomepageTestimonial[];
}> {
  if (!process.env.MONGODB_URI?.trim()) {
    return {
      featured: mockCards(featuredProducts),
      newArrivals: mockCards(newArrivals),
      reviews: [],
      testimonials: [],
    };
  }
  await connectToDatabase();
  const [featured, arrivals, reviews, testimonials] = await Promise.all([
    listProducts({ ...defaultFilters, featured: true, sort: "featured" }),
    listProducts({ ...defaultFilters, newArrival: true, sort: "newest" }),
    ReviewModel.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title comment rating verifiedPurchase user product")
      .populate({ path: "user", select: "name" })
      .populate({ path: "product", select: "name" })
      .lean()
      .exec(),
    TestimonialModel.find({ approved: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(3)
      .select("authorName quote attribution")
      .lean()
      .exec(),
  ]);
  return {
    featured: productCards(featured.products),
    newArrivals: productCards(arrivals.products),
    reviews: reviews.map((review) => {
      const user =
        review.user && typeof review.user === "object"
          ? (review.user as { name?: string })
          : null;
      const product =
        review.product && typeof review.product === "object"
          ? (review.product as { name?: string })
          : null;
      return {
        id: review._id.toString(),
        title: review.title,
        comment: review.comment,
        rating: review.rating,
        verifiedPurchase: review.verifiedPurchase,
        reviewer: user?.name || "Customer",
        productName: product?.name || "Dr. Golechas product",
      };
    }),
    testimonials: testimonials.map((testimonial) => ({
      id: testimonial._id.toString(),
      authorName: testimonial.authorName,
      quote: testimonial.quote,
      attribution: testimonial.attribution ?? "",
    })),
  };
}
