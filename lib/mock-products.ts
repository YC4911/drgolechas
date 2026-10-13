import type { Product } from "@/types/product";

export const featuredProducts: Product[] = [
  {
    id: "herbal-hair-oil",
    name: "Botanical Hair Oil",
    category: "Personal Care",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Amber glass bottle beside botanical leaves",
    rating: 4.8,
    reviewCount: 124,
    mrp: 699,
    sellingPrice: 549,
    badge: "Bestseller",
  },
  {
    id: "daily-wellness-blend",
    name: "Daily Wellness Blend",
    category: "Wellness",
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Natural skincare and wellness bottles on a warm surface",
    rating: 4.7,
    reviewCount: 86,
    mrp: 899,
    sellingPrice: 749,
    badge: "New",
  },
  {
    id: "garden-care-kit",
    name: "Everyday Garden Kit",
    category: "Farm Essential",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Fresh green plants in a home garden",
    rating: 4.9,
    reviewCount: 53,
    mrp: 1199,
    sellingPrice: 999,
  },
  {
    id: "gentle-face-cleanser",
    name: "Gentle Face Cleanser",
    category: "Personal Care",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Minimal personal care bottles with soft natural light",
    rating: 4.6,
    reviewCount: 97,
    mrp: 599,
    sellingPrice: 499,
  },
];

export const newArrivals: Product[] = [
  {
    ...featuredProducts[2],
    id: "balcony-grow-kit",
    name: "Balcony Grow Kit",
    badge: "Just in",
  },
  {
    ...featuredProducts[1],
    id: "herbal-evening-tea",
    name: "Herbal Evening Tea",
    category: "Wellness",
    badge: "Just in",
  },
  {
    ...featuredProducts[3],
    id: "daily-care-set",
    name: "Daily Care Set",
    badge: "Just in",
  },
  {
    ...featuredProducts[0],
    id: "botanical-body-oil",
    name: "Botanical Body Oil",
    badge: "Just in",
  },
];
