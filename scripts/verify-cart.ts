import assert from "node:assert/strict";
import { calculateCartTotals } from "@/lib/cart/totals";

const exclusive = calculateCartTotals(
  [
    {
      quantity: 2,
      unitPrice: 100,
      mrp: 120,
      gstRate: 18,
      couponEligible: true,
    },
    {
      quantity: 1,
      unitPrice: 50,
      mrp: 50,
      gstRate: 5,
      couponEligible: false,
    },
  ],
  20,
  { flatShipping: 50, freeShippingThreshold: 300, pricesIncludeGst: false },
);

assert.deepEqual(exclusive, {
  subtotal: 250,
  discount: 40,
  couponDiscount: 20,
  tax: 34.9,
  shipping: 50,
  total: 314.9,
});

const inclusive = calculateCartTotals(
  [{ quantity: 1, unitPrice: 118, mrp: 118, gstRate: 18, couponEligible: true }],
  0,
  { flatShipping: 0, freeShippingThreshold: 0, pricesIncludeGst: true },
);

assert.deepEqual(inclusive, {
  subtotal: 118,
  discount: 0,
  couponDiscount: 0,
  tax: 18,
  shipping: 0,
  total: 118,
});

assert.equal(
  calculateCartTotals(
    [{ quantity: 1, unitPrice: 10, mrp: 10, gstRate: 0, couponEligible: false }],
    100,
    { flatShipping: 25, freeShippingThreshold: 0, pricesIncludeGst: false },
  ).total,
  10,
);

console.info("Verified inclusive/exclusive GST, discounts, coupons, shipping, and totals.");