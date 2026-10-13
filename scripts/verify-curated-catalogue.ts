import assert from "node:assert/strict";
import { curatedProducts } from "@/lib/products/curated-catalogue";

assert.equal(curatedProducts.length, 13);
const allSkus = curatedProducts.flatMap((product) =>
  product.variants.map((variant) => variant.sku),
);
assert.equal(new Set(allSkus).size, allSkus.length);
assert.deepEqual(
  Object.fromEntries(
    ["farm-essentials", "ayurvedic-wellness", "herbal-personal-care"].map(
      (slug) => [
        slug,
        curatedProducts.filter((product) => product.categorySlug === slug)
          .length,
      ],
    ),
  ),
  {
    "farm-essentials": 3,
    "ayurvedic-wellness": 6,
    "herbal-personal-care": 4,
  },
);

const variantBySku = new Map(
  curatedProducts.flatMap((product) =>
    product.variants.map((variant) => [variant.sku, variant] as const),
  ),
);
for (const [sku, expectedPrice, expectedMrp] of [
  ["DGHF-GUL-300", 249, 299],
  ["DGHF-GUL-500", 379, 449],
  ["DGHF-GHE-500", 949, 1099],
  ["DGHF-HON-500", 599, 699],
  ["DGHF-CHY-500", 429, 499],
  ["DGHF-SKP-500", 429, 499],
  ["DGHF-ISA-100", 179, 199],
  ["DGHF-ASH-100", 129, 149],
  ["DGHF-SHA-100", 149, 169],
  ["DGHF-ABO-100", 249, 299],
  ["DGHF-HP-100", 219, 249],
  ["DGHF-FP-050", 169, 199],
  ["DGHF-TP-100", 129, 149],
] as const) {
  const variant = variantBySku.get(sku);
  assert.ok(variant, `Missing ${sku}`);
  assert.equal(variant.price, expectedPrice);
  assert.equal(variant.mrp, expectedMrp);
  assert.equal(variant.priceApproved, false);
}

for (const sku of [
  "DGHF-GHE-250",
  "DGHF-GHE-1000",
  "DGHF-HON-250",
  "DGHF-HON-1000",
  "DGHF-TP-050",
]) {
  const variant = variantBySku.get(sku);
  assert.ok(variant, `Missing ${sku}`);
  assert.equal(variant.price, 0);
  assert.equal(variant.mrp, 0);
}

assert.equal(
  curatedProducts.find(({ slug }) => slug === "suvarnaprashan")
    ?.publicationStatus,
  "pending_regulatory_review",
);
assert.ok(
  curatedProducts.every((product) =>
    product.image.startsWith("data:image/svg+xml"),
  ),
);
console.info(
  `Verified ${curatedProducts.length} draft products, ${allSkus.length} unique variant SKUs, category assignments, supplied prices, and approval safeguards.`,
);
