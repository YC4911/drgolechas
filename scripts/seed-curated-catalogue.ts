import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { demoCategories } from "@/lib/demo-data";
import { CategoryModel } from "@/models/category";
import { InventoryModel } from "@/models/inventory";
import { ProductModel } from "@/models/product";
import { curatedProducts } from "@/lib/products/curated-catalogue";

async function seedCuratedCatalogue(): Promise<void> {
  try {
    await connectToDatabase();
    const categoryIds = new Map<string, mongoose.Types.ObjectId>();

    for (const slug of new Set(
      curatedProducts.map(({ categorySlug }) => categorySlug),
    )) {
      const categoryData = demoCategories.find(
        (category) => category.slug === slug,
      );
      if (!categoryData) throw new Error(`No category definition for ${slug}.`);

      let category = await CategoryModel.findOne({ slug }).exec();
      if (!category) {
        category = await CategoryModel.create({
          ...categoryData,
          parentCategory: null,
          active: true,
        });
      } else if (!category.active) {
        category.active = true;
        await category.save();
      }
      categoryIds.set(slug, category._id);
    }

    const allSkus = curatedProducts.flatMap(({ variants }) =>
      variants.map(({ sku }) => sku),
    );
    if (new Set(allSkus).size !== allSkus.length) {
      throw new Error("Catalogue contains duplicate SKU values.");
    }

    for (const entry of curatedProducts) {
      const category = categoryIds.get(entry.categorySlug);
      if (!category) throw new Error(`Missing category ${entry.categorySlug}.`);
      const skus = entry.variants.map(({ sku }) => sku);
      const matches = await ProductModel.find({
        $or: [
          { slug: entry.slug },
          { sku: { $in: skus } },
          { "variants.sku": { $in: skus } },
        ],
      })
        .select("_id slug sku")
        .lean()
        .exec();
      if (new Set(matches.map(({ _id }) => _id.toString())).size > 1) {
        throw new Error(
          `Product ${entry.slug} matches multiple existing records. Resolve the duplicate before seeding.`,
        );
      }
      const existing = matches[0];
      const conflictingSku = await ProductModel.findOne({
        _id: { $ne: existing?._id },
        $or: [{ sku: { $in: skus } }, { "variants.sku": { $in: skus } }],
      })
        .select("_id")
        .lean()
        .exec();
      if (conflictingSku) {
        throw new Error(
          `One or more SKUs for ${entry.slug} already belong to a different product.`,
        );
      }

      const firstVariant = entry.variants[0];
      if (!firstVariant) throw new Error(`${entry.slug} has no pack sizes.`);
      const imageAlt = `${entry.name} product illustration placeholder`;
      const saved = await ProductModel.findOneAndUpdate(
        existing ? { _id: existing._id } : { slug: entry.slug },
        {
          $set: {
            name: entry.name,
            slug: entry.slug,
            sku: firstVariant.sku,
            category,
            subcategory: null,
            description: entry.description,
            shortDescription: entry.shortDescription,
            price: firstVariant.price,
            mrp: firstVariant.mrp,
            discountPercentage: 0,
            gst: 0,
            stock: 0,
            lowStockThreshold: 5,
            images: [{ url: entry.image, alt: imageAlt }],
            thumbnail: entry.image,
            ingredients: [],
            benefits: [],
            howToUse:
              "Directions are pending verification against the final product information.",
            storageInstructions:
              "Storage instructions are pending verification against the final product information.",
            safetyInformation:
              "Safety information and precautions are pending product verification.",
            regulatoryClassification:
              "Pending verification for the final product and applicable licence.",
            productDetailsVerified: false,
            priceApproved: false,
            publicationStatus: entry.publicationStatus,
            specifications: {
              packSizes: entry.variants.map(({ name }) => name).join(", "),
              productImageStatus:
                "Illustration placeholder; replace with approved product photography.",
              pricingStatus: "Proposed prices are pending approval.",
            },
            tags: ["dr-golechas-catalogue", "unpublished-draft"],
            productType: entry.productType,
            useCases: [],
            preferences: [],
            variants: entry.variants.map((item) => ({
              name: item.name,
              sku: item.sku,
              price: item.price,
              mrp: item.mrp,
              stock: 0,
              packQuantity: item.packQuantity,
              packUnit: item.packUnit,
              priceApproved: item.priceApproved,
              attributes: { packSize: item.name },
            })),
            featured: false,
            newArrival: false,
            active: true,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ).exec();
      if (!saved) throw new Error(`Could not save product ${entry.slug}.`);

      await InventoryModel.findOneAndUpdate(
        { product: saved._id },
        {
          $set: { quantity: 0, lowStockThreshold: 5 },
          $setOnInsert: { reserved: 0 },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ).exec();
    }

    console.info(
      `Upserted ${curatedProducts.length} unpublished catalogue products; prices, details and regulatory status remain unapproved.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedCuratedCatalogue().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown catalogue seed error.";
  console.error(`Curated catalogue seeding failed: ${message}`);
  process.exitCode = 1;
});
