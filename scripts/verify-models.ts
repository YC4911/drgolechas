import assert from "node:assert/strict";
import {
  AddressModel,
  AdminModel,
  AuthRateLimitModel,
  CartModel,
  CategoryModel,
  CouponModel,
  CouponRedemptionModel,
  InventoryModel,
  OrderModel,
  PaymentModel,
  PaymentWebhookEventModel,
  ProductModel,
  ReviewModel,
  SiteSettingsModel,
  TestimonialModel,
  UserModel,
  UserSessionModel,
} from "@/models";

const models = [
  UserModel,
  UserSessionModel,
  AuthRateLimitModel,
  CartModel,
  ProductModel,
  CategoryModel,
  OrderModel,
  ReviewModel,
  CouponModel,
  CouponRedemptionModel,
  AddressModel,
  PaymentModel,
  PaymentWebhookEventModel,
  InventoryModel,
  TestimonialModel,
  SiteSettingsModel,
  AdminModel,
];

assert.equal(models.length, 17);

for (const model of models.filter((item) => item !== AuthRateLimitModel)) {
  assert.equal(
    model.schema.options.timestamps,
    true,
    `${model.modelName} timestamps`,
  );
}

assert.equal(AuthRateLimitModel.schema.options.timestamps, false);
assert.ok(AuthRateLimitModel.schema.path("expiresAt"));
assert.equal(UserModel.schema.path("passwordHash")?.options.select, false);
assert.equal(UserSessionModel.schema.path("tokenHash")?.options.select, false);
assert.ok(PaymentWebhookEventModel.schema.path("eventId"));
assert.equal(ProductModel.schema.path("category")?.options.ref, "Category");
assert.equal(
  CategoryModel.schema.path("parentCategory")?.options.ref,
  "Category",
);

console.info(`Verified ${models.length} auth and domain Mongoose models.`);
