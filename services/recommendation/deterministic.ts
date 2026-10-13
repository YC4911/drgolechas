import type {
  FinderAnswers,
  RecommendationProduct,
  RecommendationProvider,
  RecommendedProduct,
} from "@/services/recommendation/types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matches(value: string, selected: string): boolean {
  const normalizedValue = normalize(value);
  const normalizedSelected = normalize(selected);
  return (
    normalizedValue === normalizedSelected ||
    normalizedValue.includes(normalizedSelected) ||
    normalizedSelected.includes(normalizedValue)
  );
}

function explain(
  product: RecommendationProduct,
  answers: FinderAnswers,
): string {
  const matchedPreferences = answers.preferences.some((preference) =>
    [...product.preferences, ...product.tags].some((item) =>
      matches(item, preference),
    ),
  );
  const matchedGoal = [...product.useCases, ...product.tags].some((item) =>
    matches(item, answers.shoppingFor),
  );
  const reasons: string[] = [];
  if (answers.category) reasons.push("your selected category");
  if (answers.productType) reasons.push("your selected product format");
  if (matchedPreferences) reasons.push("your selected preferences");
  if (matchedGoal) reasons.push("your shopping goal");
  if (answers.maximumPrice !== null) reasons.push("your budget");

  if (reasons.length === 0) {
    return "Recommended because it is currently available to browse.";
  }
  return `Recommended because it matches ${reasons.join(", ").replace(/, ([^,]*)$/, " and $1")}.`;
}

export const deterministicRecommendationProvider: RecommendationProvider = {
  async recommend(
    products: RecommendationProduct[],
    answers: FinderAnswers,
  ): Promise<RecommendedProduct[]> {
    const candidates = products
      .filter((product) => !answers.inStockOnly || product.stock > 0)
      .filter(
        (product) =>
          answers.maximumPrice === null ||
          product.price <= answers.maximumPrice,
      )
      .filter(
        (product) =>
          !answers.category ||
          product.category.slug === answers.category ||
          product.subcategory?.slug === answers.category,
      )
      .filter(
        (product) =>
          !answers.productType ||
          matches(product.productType, answers.productType),
      )
      .filter((product) =>
        answers.preferences.every((preference) =>
          [...product.preferences, ...product.tags].some((item) =>
            matches(item, preference),
          ),
        ),
      )
      .map((product) => {
        const goalMatch = [...product.useCases, ...product.tags].some((item) =>
          matches(item, answers.shoppingFor),
        );
        const preferenceMatches = answers.preferences.filter((preference) =>
          [...product.preferences, ...product.tags].some((item) =>
            matches(item, preference),
          ),
        ).length;
        return {
          product,
          score:
            (goalMatch ? 4 : 0) +
            preferenceMatches * 3 +
            (product.newArrival ? 1 : 0) +
            (product.rating > 0 ? product.rating / 10 : 0),
        };
      })
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.product.stock - left.product.stock ||
          left.product.name.localeCompare(right.product.name),
      )
      .slice(0, 12);

    return candidates.map(({ product }) => ({
      product,
      reason: explain(product, answers),
    }));
  },
};
