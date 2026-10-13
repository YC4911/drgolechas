export interface FinderAnswers {
  shoppingFor: string;
  category: string | null;
  productType: string | null;
  preferences: string[];
  maximumPrice: number | null;
  inStockOnly: boolean;
}

export interface FinderCategory {
  name: string;
  slug: string;
}

export interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  category: FinderCategory;
  subcategory?: FinderCategory | null;
  price: number;
  mrp: number;
  discountPercentage: number;
  stock: number;
  thumbnail: string;
  images: { url: string; alt: string }[];
  variants: {
    name: string;
    sku: string;
    price: number;
    mrp: number;
    stock: number;
  }[];
  rating: number;
  reviewCount: number;
  productType: string;
  tags: string[];
  useCases: string[];
  preferences: string[];
  newArrival: boolean;
}

export interface RecommendedProduct {
  product: RecommendationProduct;
  reason: string;
}

export interface RecommendationProvider {
  recommend(
    products: RecommendationProduct[],
    answers: FinderAnswers,
  ): Promise<RecommendedProduct[]>;
}
