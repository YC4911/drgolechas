import type { CategoryRecord } from "@/models/category";

export type DemoCategory = Pick<
  CategoryRecord,
  | "name"
  | "slug"
  | "description"
  | "image"
  | "displayOrder"
  | "seoTitle"
  | "seoDescription"
>;

export const demoCategories: DemoCategory[] = [
  {
    name: "Farm Essentials",
    slug: "farm-essentials",
    description: "Traditional food and pantry staples inspired by the farm and everyday rituals.",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=85",
    displayOrder: 1,
    seoTitle: "Farm Essentials | Dr. Golecha's Herbal Farm",
    seoDescription: "Traditional foods and pantry essentials from Dr. Golecha's Herbal Farm.",
  },
  {
    name: "Ayurvedic Wellness",
    slug: "ayurvedic-wellness",
    description: "Time-honoured formulations and wellness preparations for daily care.",
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85",
    displayOrder: 2,
    seoTitle: "Ayurvedic Wellness | Dr. Golecha's Herbal Farm",
    seoDescription: "Thoughtful Ayurvedic wellness products selected for traditional use.",
  },
  {
    name: "Herbal Personal Care",
    slug: "herbal-personal-care",
    description: "Botanical care for hair, skin, and oral routines.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=85",
    displayOrder: 3,
    seoTitle: "Herbal Personal Care | Dr. Golecha's Herbal Farm",
    seoDescription: "Botanical personal-care products for simple, grounded routines.",
  },
];

export interface DemoProduct {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  price: number;
  mrp: number;
  image: string;
  imageAlt: string;
  featured: boolean;
  newArrival: boolean;
}

const productDescription =
  "Product information is presented as a provisional storefront draft. Before launch, approved formulation detail, manufacturing information, and applicable regulatory information should be confirmed and updated.";

export const demoProducts: DemoProduct[] = [
  {
    name: "Gulkand",
    slug: "gulkand",
    sku: "DGHF-GUL-300",
    categorySlug: "farm-essentials",
    description: productDescription,
    shortDescription: "Traditional rose-petal preparation with a characteristic aroma and texture.",
    price: 249,
    mrp: 299,
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Gulkand in a glass jar on a natural surface",
    featured: true,
    newArrival: false,
  },
  {
    name: "Gir Cow Ghee",
    slug: "gir-cow-ghee",
    sku: "DGHF-GHE-500",
    categorySlug: "farm-essentials",
    description: productDescription,
    shortDescription: "Traditional cow ghee with sourcing, processing, and traceability details to be confirmed.",
    price: 949,
    mrp: 1099,
    image: "https://images.unsplash.com/photo-1604908553252-8d2f2909d35b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Ghee in a jar beside natural ingredients",
    featured: true,
    newArrival: false,
  },
  {
    name: "Raw Honey",
    slug: "raw-honey",
    sku: "DGHF-HON-500",
    categorySlug: "farm-essentials",
    description: productDescription,
    shortDescription: "Naturally sourced honey with origin and handling details reviewed before publication.",
    price: 599,
    mrp: 699,
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Honey jar and spoon on a warm surface",
    featured: false,
    newArrival: true,
  },
  {
    name: "Chyavanprash",
    slug: "chyavanprash",
    sku: "DGHF-CHY-500",
    categorySlug: "ayurvedic-wellness",
    description: productDescription,
    shortDescription: "A traditional Ayurvedic formulation with ingredients and claims reviewed against the final product specification.",
    price: 429,
    mrp: 499,
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Traditional Ayurvedic product jar in natural light",
    featured: true,
    newArrival: false,
  },
  {
    name: "Suvarnaprashan",
    slug: "suvarnaprashan",
    sku: "DGHF-SVP-010",
    categorySlug: "ayurvedic-wellness",
    description: "This product is intentionally kept unpublished until formulation, product category, manufacturing licence, age suitability, dosage, and claims are reviewed and approved.",
    shortDescription: "Pending formulation review before public listing.",
    price: 449,
    mrp: 499,
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Pending approval wellness product",
    featured: false,
    newArrival: false,
  },
  {
    name: "Shatavari Kalp",
    slug: "shatavari-kalp",
    sku: "DGHF-SKP-500",
    categorySlug: "ayurvedic-wellness",
    description: productDescription,
    shortDescription: "Shatavari-based traditional preparation with final formulation details aligned to the approved product version.",
    price: 429,
    mrp: 499,
    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Ayurvedic powder preparation in a jar",
    featured: false,
    newArrival: true,
  },
  {
    name: "Isabgol Bhusi",
    slug: "isabgol-bhusi",
    sku: "DGHF-ISA-100",
    categorySlug: "ayurvedic-wellness",
    description: productDescription,
    shortDescription: "Isabgol husk for dietary use, with clear ingredient, usage, and safety information.",
    price: 179,
    mrp: 199,
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Isabgol husk in a packet",
    featured: false,
    newArrival: false,
  },
  {
    name: "Ashwagandha Churna",
    slug: "ashwagandha-churna",
    sku: "DGHF-ASH-100",
    categorySlug: "ayurvedic-wellness",
    description: productDescription,
    shortDescription: "Botanical powder for traditional Ayurvedic use with verified identity and composition details.",
    price: 129,
    mrp: 149,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Herbal powder in a glass jar",
    featured: false,
    newArrival: false,
  },
  {
    name: "Shatavari Churna",
    slug: "shatavari-churna",
    sku: "DGHF-SHA-100",
    categorySlug: "ayurvedic-wellness",
    description: productDescription,
    shortDescription: "Traditional Shatavari powder with final formulation and regulatory details pending confirmation.",
    price: 149,
    mrp: 169,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Shatavari powder in a packet",
    featured: false,
    newArrival: false,
  },
  {
    name: "Amla Bhringraj Hair Oil",
    slug: "amla-bhringraj-hair-oil",
    sku: "DGHF-ABO-100",
    categorySlug: "herbal-personal-care",
    description: productDescription,
    shortDescription: "Hair and scalp care oil inspired by traditional Amla and Bhringraj practices.",
    price: 249,
    mrp: 299,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Herbal hair oil in a bottle",
    featured: true,
    newArrival: false,
  },
  {
    name: "Herbal Hair Pack",
    slug: "herbal-hair-pack",
    sku: "DGHF-HP-100",
    categorySlug: "herbal-personal-care",
    description: productDescription,
    shortDescription: "Botanical hair-care preparation with clear application guidance and ingredient disclosure.",
    price: 219,
    mrp: 249,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Botanical hair treatment in a jar",
    featured: false,
    newArrival: false,
  },
  {
    name: "Herbal Face Pack",
    slug: "herbal-face-pack",
    sku: "DGHF-FP-050",
    categorySlug: "herbal-personal-care",
    description: productDescription,
    shortDescription: "Botanical skin-care product with ingredient, usage, and safety guidance for responsible use.",
    price: 169,
    mrp: 199,
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Herbal face mask in a container",
    featured: false,
    newArrival: true,
  },
  {
    name: "Herbal Tooth Powder",
    slug: "herbal-tooth-powder",
    sku: "DGHF-TP-100",
    categorySlug: "herbal-personal-care",
    description: productDescription,
    shortDescription: "Traditional herbal oral-care product with ingredient transparency and suitable usage guidance.",
    price: 129,
    mrp: 149,
    image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Herbal oral care powder in a container",
    featured: false,
    newArrival: false,
  },
];

export const demoTestimonials = [
  {
    authorName: "Customer review pending",
    quote: "Customer testimonials will be published only after approval and verification.",
    attribution: "Awaiting approval",
  },
  {
    authorName: "Customer review pending",
    quote: "Customer testimonials will be published only after approval and verification.",
    attribution: "Awaiting approval",
  },
  {
    authorName: "Customer review pending",
    quote: "Customer testimonials will be published only after approval and verification.",
    attribution: "Awaiting approval",
  },
];
