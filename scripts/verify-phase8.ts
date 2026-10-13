import assert from "node:assert/strict";
import { deterministicRecommendationProvider } from "@/services/recommendation/deterministic";
import { finderAnswersSchema } from "@/services/recommendation";
import type {
  FinderAnswers,
  RecommendationProduct,
} from "@/services/recommendation/types";
import { reviewSubmissionSchema } from "@/lib/reviews/validation";

const products: RecommendationProduct[] = [
  {
    id: "1",
    name: "Garden set",
    slug: "garden-set",
    sku: "GARDEN-1",
    shortDescription: "A gardening kit.",
    category: { name: "Farm Essentials", slug: "farm-essential" },
    subcategory: null,
    price: 400,
    mrp: 500,
    discountPercentage: 20,
    stock: 4,
    thumbnail: "/garden.jpg",
    images: [],
    variants: [],
    rating: 4,
    reviewCount: 2,
    productType: "kit",
    tags: ["reusable"],
    useCases: ["home and garden"],
    preferences: ["reusable"],
    newArrival: true,
  },
  {
    id: "2",
    name: "Unavailable kit",
    slug: "unavailable-kit",
    sku: "GARDEN-2",
    shortDescription: "An unavailable kit.",
    category: { name: "Farm Essentials", slug: "farm-essential" },
    subcategory: null,
    price: 350,
    mrp: 450,
    discountPercentage: 22,
    stock: 0,
    thumbnail: "/unavailable.jpg",
    images: [],
    variants: [],
    rating: 0,
    reviewCount: 0,
    productType: "kit",
    tags: ["reusable"],
    useCases: ["home and garden"],
    preferences: ["reusable"],
    newArrival: false,
  },
  {
    id: "3",
    name: "Over-budget kit",
    slug: "over-budget-kit",
    sku: "GARDEN-3",
    shortDescription: "A kit outside the selected budget.",
    category: { name: "Farm Essentials", slug: "farm-essential" },
    subcategory: null,
    price: 900,
    mrp: 1000,
    discountPercentage: 10,
    stock: 6,
    thumbnail: "/expensive.jpg",
    images: [],
    variants: [],
    rating: 0,
    reviewCount: 0,
    productType: "kit",
    tags: [],
    useCases: ["home and garden"],
    preferences: [],
    newArrival: false,
  },
];

const answers: FinderAnswers = {
  shoppingFor: "home-and-garden",
  category: "farm-essential",
  productType: "kit",
  preferences: ["reusable"],
  maximumPrice: 500,
  inStockOnly: true,
};

async function verify(): Promise<void> {
  const recommendations = await deterministicRecommendationProvider.recommend(
    products,
    answers,
  );
  assert.deepEqual(
    recommendations.map(({ product }) => product.id),
    ["1"],
  );
  assert.match(recommendations[0].reason, /selected category/);
  assert.equal(finderAnswersSchema.safeParse(answers).success, true);
  assert.equal(
    finderAnswersSchema.safeParse({ ...answers, maximumPrice: -1 }).success,
    false,
  );
  assert.equal(
    reviewSubmissionSchema.safeParse({
      rating: 5,
      title: "Great",
      comment: "Useful product.",
    }).success,
    true,
  );
  assert.equal(
    reviewSubmissionSchema.safeParse({
      rating: 6,
      title: "Great",
      comment: "Useful product.",
    }).success,
    false,
  );
  assert.equal(
    reviewSubmissionSchema.safeParse({
      rating: 5,
      title: "",
      comment: "Useful product.",
    }).success,
    false,
  );
  console.info(
    "Product finder matching, budget/availability filters, and review validation passed.",
  );
}

verify().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
