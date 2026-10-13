import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  demoCategories,
  demoProducts,
  demoTestimonials,
} from "@/lib/demo-data";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";
import { TestimonialModel } from "@/models/testimonial";
import { curatedProducts } from "@/lib/products/curated-catalogue";

async function seed(): Promise<void> {
  try {
    await connectToDatabase();

    const categoryIds = new Map<string, mongoose.Types.ObjectId>();

    for (const category of demoCategories) {
      const savedCategory = await CategoryModel.findOneAndUpdate(
        { slug: category.slug },
        { $set: { ...category, active: true, parentCategory: null } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );

      if (!savedCategory) {
        throw new Error(`Could not seed category ${category.slug}.`);
      }

      categoryIds.set(category.slug, savedCategory._id);
    }

    const curatedSlugs = new Set(curatedProducts.map(({ slug }) => slug));
    const curatedSkus = new Set(
      curatedProducts.flatMap(({ variants }) => variants.map(({ sku }) => sku)),
    );
    let demoProductsSeeded = 0;

    for (const product of demoProducts) {
      if (curatedSlugs.has(product.slug) || curatedSkus.has(product.sku)) {
        continue;
      }
      const category = categoryIds.get(product.categorySlug);

      if (!category) {
        throw new Error(`Missing seed category ${product.categorySlug}.`);
      }

      const discountPercentage = Math.round(
        ((product.mrp - product.price) / product.mrp) * 100,
      );

      await ProductModel.findOneAndUpdate(
        { slug: product.slug },
        {
          $set: {
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            category,
            description: product.description,
            shortDescription: product.shortDescription,
            price: product.price,
            mrp: product.mrp,
            discountPercentage,
            gst: 0,
            stock: 0,
            lowStockThreshold: 5,
            images: [{ url: product.image, alt: product.imageAlt }],
            thumbnail: product.image,
            ingredients: [],
            benefits: [],
            howToUse: "",
            specifications: {},
            tags: ["demo", "placeholder"],
            variants: [],
            featured: product.featured,
            newArrival: product.newArrival,
            active: true,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      demoProductsSeeded += 1;
    }

    for (const testimonial of demoTestimonials) {
      await TestimonialModel.findOneAndUpdate(
        { authorName: testimonial.authorName },
        { $set: { ...testimonial, approved: false } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    }

    console.info(
      `Seeded ${demoCategories.length} categories, ${demoProductsSeeded} non-catalogue demo products, and ${demoTestimonials.length} placeholder testimonials. Curated product records are managed by npm run seed:catalogue.`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown seed error.";
    console.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void seed();
