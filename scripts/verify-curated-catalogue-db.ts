import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { ApiError } from "@/lib/api/errors";
import { addCartItem } from "@/lib/cart/service";
import { connectToDatabase } from "@/lib/db/connect";
import { CartModel } from "@/models/cart";
import { CategoryModel } from "@/models/category";
import { InventoryModel } from "@/models/inventory";
import { ProductModel } from "@/models/product";
import { getProductBySlug, listProducts } from "@/lib/products/service";
import { parseProductFilters } from "@/lib/products/validation";
import { curatedProducts } from "@/lib/products/curated-catalogue";

async function verifyDatabaseCatalogue(): Promise<void> {
  let cartId: mongoose.Types.ObjectId | undefined;
  try {
    await connectToDatabase();
    const [products, categories] = await Promise.all([
      ProductModel.find({
        slug: { $in: curatedProducts.map(({ slug }) => slug) },
      })
        .select(
          "_id name slug sku category price mrp stock active priceApproved publicationStatus productDetailsVerified variants",
        )
        .lean()
        .exec(),
      CategoryModel.find({
        slug: {
          $in: [
            "farm-essentials",
            "ayurvedic-wellness",
            "herbal-personal-care",
          ],
        },
        active: true,
      })
        .select("slug")
        .lean()
        .exec(),
    ]);

    assert.equal(products.length, 13);
    assert.equal(categories.length, 3);
    const bySlug = new Map(products.map((item) => [item.slug, item]));
    const skus = new Set<string>();
    for (const curated of curatedProducts) {
      const saved = bySlug.get(curated.slug);
      assert.ok(saved, `Missing database product ${curated.slug}`);
      assert.equal(
        saved.category.toString(),
        (
          await CategoryModel.findOne({ slug: curated.categorySlug })
            .select("_id")
            .lean()
            .exec()
        )?._id.toString(),
      );
      assert.equal(saved.variants.length, curated.variants.length);
      assert.equal(saved.active, true);
      assert.equal(saved.publicationStatus, curated.publicationStatus);
      assert.equal(saved.priceApproved, false);
      assert.equal(saved.productDetailsVerified, false);
      assert.equal(saved.stock, 0);
      assert.ok(
        saved.variants.every((variant) => variant.priceApproved === false),
      );
      for (const variant of saved.variants) {
        assert.ok(
          !skus.has(variant.sku),
          `Duplicate database SKU ${variant.sku}`,
        );
        skus.add(variant.sku);
      }
      const page = await getProductBySlug(curated.slug);
      assert.ok(page, `Product detail lookup failed for ${curated.slug}`);
      assert.equal(page.purchasable, false);
      assert.equal(page.priceApproved, false);
      assert.equal(page.price, 0);
      assert.ok(
        page.variants.every(
          (variant) => variant.price === 0 && variant.mrp === 0,
        ),
      );
    }

    for (const [slug, expectedCount] of [
      ["farm-essentials", 3],
      ["ayurvedic-wellness", 6],
      ["herbal-personal-care", 4],
    ] as const) {
      const filters = parseProductFilters(
        new URLSearchParams(`category=${slug}&pageSize=48`),
      );
      assert.equal(filters.success, true);
      if (!filters.success) continue;
      const page = await listProducts(filters.data);
      assert.equal(page.pagination.totalProducts, expectedCount);
    }

    const first = products[0];
    assert.ok(first);
    const guestTokenHash = randomBytes(32).toString("hex");
    const cart = await CartModel.create({
      guestTokenHash,
      items: [],
      expiresAt: new Date(Date.now() + 60_000),
    });
    cartId = cart._id;
    const variantSku = first.variants[0]?.sku;
    assert.ok(variantSku);
    await assert.rejects(
      addCartItem(cart, first._id.toString(), variantSku, 1),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 409 &&
        error.message.includes("not approved"),
    );
    const inventoryCount = await InventoryModel.countDocuments({
      product: { $in: products.map(({ _id }) => _id) },
      quantity: 0,
    });
    assert.equal(inventoryCount, 13);

    console.info(
      `Verified ${products.length} database product pages, ${skus.size} unique pack SKUs, all 3 category listings, zero-stock inventory, and cart/checkout publication guards.`,
    );
  } finally {
    if (cartId) await CartModel.deleteOne({ _id: cartId }).exec();
    await mongoose.disconnect();
  }
}

verifyDatabaseCatalogue().catch((error: unknown) => {
  console.error("Database catalogue verification failed.", error);
  process.exitCode = 1;
});
