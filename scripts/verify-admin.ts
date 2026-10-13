import assert from "node:assert/strict";
import {
  adminCouponUpdateSchema,
  adminProductSchema,
  adminSocialSchema,
  adminSettingsSchema,
  adminUploadSchema,
} from "@/lib/admin/validation";
import { resolveAdminPermissions } from "@/lib/admin/permissions";

const product = {
  name: "Test product",
  sku: "TEST-1",
  category: "0123456789abcdef01234567",
  description: "Product description",
  shortDescription: "Short product description",
  price: 100,
  mrp: 120,
  thumbnail: "/api/uploads/product.webp",
  ingredients: ["Verified ingredient"],
  howToUse: "Use according to the approved label.",
  storageInstructions: "Store as stated on the approved label.",
  safetyInformation: "Follow the approved product label.",
  regulatoryClassification: "Verified classification",
};

assert.equal(adminProductSchema.safeParse(product).success, true);
assert.equal(
  adminProductSchema.safeParse({
    ...product,
    publicationStatus: "published",
    priceApproved: false,
  }).success,
  false,
);
assert.equal(
  adminProductSchema.safeParse({
    ...product,
    publicationStatus: "published",
    productDetailsVerified: false,
  }).success,
  false,
);
assert.equal(
  adminProductSchema.safeParse({ ...product, price: 130 }).success,
  false,
);
assert.equal(
  adminProductSchema.safeParse({
    ...product,
    thumbnail: "javascript:alert(1)",
  }).success,
  false,
);
assert.equal(
  adminSocialSchema.safeParse({ instagram: "https://example.com" }).success,
  true,
);
assert.equal(
  adminSocialSchema.safeParse({ instagram: "javascript:alert(1)" }).success,
  false,
);
assert.equal(
  adminSettingsSchema.safeParse({ shippingSettings: { flatRate: 50 } }).success,
  true,
);
assert.equal(
  adminCouponUpdateSchema.safeParse({
    startDate: "2026-02-01",
    expiryDate: "2026-01-01",
  }).success,
  false,
);
assert.equal(adminUploadSchema.safeParse("categories").success, true);
assert.equal(adminUploadSchema.safeParse("unknown").success, false);

const all = resolveAdminPermissions("superadmin", []);
assert.ok(all.includes("settings:write"));
assert.equal(resolveAdminPermissions("admin", []).length, all.length);
assert.deepEqual(resolveAdminPermissions("staff", []), []);
assert.deepEqual(resolveAdminPermissions("staff", ["orders:read", "unknown"]), [
  "orders:read",
]);
console.info("Admin validation and permission checks passed.");
