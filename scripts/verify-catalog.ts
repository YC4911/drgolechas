import assert from "node:assert/strict";
import {
  createCategorySchema,
  createProductSchema,
  parseProductFilters,
} from "@/lib/products/validation";

const parsedFilters = parseProductFilters(
  new URLSearchParams(
    "q=botanical+oil&category=wellness&sort=price-low&page=2&pageSize=24&minPrice=100&maxPrice=1500&rating=4&availability=in-stock&newArrival=true&featured=false&tags=demo%2Cwellness",
  ),
);

assert.equal(parsedFilters.success, true);
if (parsedFilters.success) {
  assert.equal(parsedFilters.data.page, 2);
  assert.equal(parsedFilters.data.sort, "price-low");
  assert.deepEqual(parsedFilters.data.tags, ["demo", "wellness"]);
  assert.equal(parsedFilters.data.newArrival, true);
  assert.equal(parsedFilters.data.featured, false);
}

assert.equal(
  parseProductFilters(
    new URLSearchParams("minPrice=&maxPrice=&rating=&newArrival=&featured="),
  ).success,
  true,
);
assert.equal(
  parseProductFilters(new URLSearchParams("minPrice=500&maxPrice=100")).success,
  false,
);
assert.equal(
  parseProductFilters(new URLSearchParams("pageSize=1000")).success,
  false,
);

const productInput = {
  name: "Demo Product",
  sku: "DEMO-01",
  category: "wellness",
  description: "Placeholder description.",
  shortDescription: "Placeholder listing.",
  price: 100,
  mrp: 120,
  thumbnail: "https://images.unsplash.com/demo.jpg",
};

assert.equal(createProductSchema.safeParse(productInput).success, true);
assert.equal(
  createProductSchema.safeParse({
    ...productInput,
    discountPercentage: 99,
  }).success,
  false,
);
assert.equal(
  createCategorySchema.safeParse({ name: "Demo Category" }).success,
  true,
);

console.info("Verified catalog query validation and protected write schemas.");
