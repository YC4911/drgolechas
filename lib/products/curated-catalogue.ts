import type { ProductPublicationStatus } from "@/models/product";

export interface CuratedVariant {
  name: string;
  sku: string;
  packQuantity: number;
  packUnit: "g" | "ml";
  price: number;
  mrp: number;
  priceApproved: false;
}

export interface CuratedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  productType: string;
  shortDescription: string;
  description: string;
  publicationStatus: ProductPublicationStatus;
  image: string;
  variants: CuratedVariant[];
}

function placeholderImage(name: string, hue: number): string {
  const escapedName = name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 920"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="hsl(${hue} 38% 94%)"/><stop offset="1" stop-color="hsl(${hue} 30% 83%)"/></linearGradient></defs><rect width="800" height="920" fill="url(#bg)"/><circle cx="400" cy="350" r="190" fill="hsl(${hue} 30% 99%)" opacity=".65"/><path d="M290 470c-24-138 36-240 110-240s134 102 110 240c-20 116-74 166-110 166s-90-50-110-166Z" fill="none" stroke="hsl(${hue} 32% 42%)" stroke-width="7"/><path d="M400 270c-3 90-30 160-80 212m80-133c22 0 56-17 72-40m-72 92c-22 0-54-16-70-36" fill="none" stroke="hsl(${hue} 32% 42%)" stroke-width="6" stroke-linecap="round"/><text x="400" y="735" text-anchor="middle" fill="#18343a" font-family="Georgia,serif" font-size="38">${escapedName}</text><text x="400" y="785" text-anchor="middle" fill="#52676a" font-family="Arial,sans-serif" font-size="19" letter-spacing="4">PRODUCT IMAGE PENDING</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function variant(
  name: string,
  sku: string,
  packQuantity: number,
  packUnit: "g" | "ml",
  price = 0,
  mrp = 0,
): CuratedVariant {
  return {
    name,
    sku,
    packQuantity,
    packUnit,
    price,
    mrp,
    priceApproved: false,
  };
}

const product = (
  name: string,
  slug: string,
  categorySlug: string,
  productType: string,
  shortDescription: string,
  description: string,
  variants: CuratedVariant[],
  publicationStatus: ProductPublicationStatus = "pending_product_verification",
): CuratedProduct => ({
  name,
  slug,
  categorySlug,
  productType,
  shortDescription,
  description,
  variants,
  publicationStatus,
  image: "",
});

export const curatedProducts: CuratedProduct[] = [
  product(
    "Gulkand",
    "gulkand",
    "farm-essentials",
    "preserve",
    "Traditional rose-petal Gulkand; final ingredients and preparation details await verification.",
    "Inspired by Indian culinary and wellness traditions. Product aroma, flavour, ingredients, sourcing and preparation must be confirmed against the final product specification before publication. No health outcomes are claimed.",
    [
      variant("300 g", "DGHF-GUL-300", 300, "g", 249, 299),
      variant("500 g", "DGHF-GUL-500", 500, "g", 379, 449),
    ],
  ),
  product(
    "Gir Cow Ghee",
    "gir-cow-ghee",
    "farm-essentials",
    "ghee",
    "Traditional cow ghee with sourcing, preparation and quality information to be verified.",
    "Product information will describe verified sourcing, traditional preparation, aroma and quality. No A1/A2 differentiation or health claims are made. The 250 ml and 1 litre prices require approval.",
    [
      variant("250 ml", "DGHF-GHE-250", 250, "ml"),
      variant("500 ml", "DGHF-GHE-500", 500, "ml", 949, 1099),
      variant("1 litre", "DGHF-GHE-1000", 1000, "ml"),
    ],
  ),
  product(
    "Raw Farm Honey",
    "raw-farm-honey",
    "farm-essentials",
    "honey",
    "Farm honey; sourcing, handling and any raw or floral claims require verification.",
    "Product information will focus on verified sourcing, flavour, careful handling and transparency. Claims such as raw, unprocessed, farm-harvested or single-flower will only be used when substantiated.",
    [
      variant("250 g", "DGHF-HON-250", 250, "g"),
      variant("500 g", "DGHF-HON-500", 500, "g", 599, 699),
      variant("1 kg", "DGHF-HON-1000", 1000, "g"),
    ],
  ),
  product(
    "Chyavanprash",
    "chyavanprash",
    "ayurvedic-wellness",
    "formulation",
    "Traditional formulation; final ingredients, licence and product claims are pending verification.",
    "Associated with Amla and selected ingredients in traditional Ayurvedic formulations. This listing makes no medical claim. The final ingredient list and all claims must match the actual licensed formulation.",
    [
      variant("250 g", "DGHF-CHY-250", 250, "g"),
      variant("500 g", "DGHF-CHY-500", 500, "g", 429, 499),
      variant("1 kg", "DGHF-CHY-1000", 1000, "g"),
    ],
  ),
  product(
    "Suvarnaprashan",
    "suvarnaprashan",
    "ayurvedic-wellness",
    "formulation",
    "Draft listing only. Not available while regulatory and safety details are reviewed.",
    "Unpublished draft. Formulation, gold content where applicable, licence, regulatory classification, dosage, age suitability and safety information must be independently verified. No dosage or medical claims are provided.",
    [variant("10 ml", "DGHF-SVP-010", 10, "ml", 449, 499)],
    "pending_regulatory_review",
  ),
  product(
    "Shatavari Kalp",
    "shatavari-kalp",
    "ayurvedic-wellness",
    "preparation",
    "Shatavari-based traditional preparation; approved formulation details are pending verification.",
    "A traditional Shatavari-based preparation. Ingredient details, product directions, licence and claims must be checked against the actual approved formulation before publication.",
    [
      variant("250 g", "DGHF-SKP-250", 250, "g"),
      variant("500 g", "DGHF-SKP-500", 500, "g", 429, 499),
    ],
  ),
  product(
    "Isabgol Bhusi",
    "isabgol-bhusi",
    "ayurvedic-wellness",
    "powder",
    "Isabgol husk for dietary use; directions and adequate-fluid precautions are pending verification.",
    "Product ingredient details, directions, adequate-fluid precautions and applicable regulatory classification must be verified before publication. This draft makes no treatment claims.",
    [
      variant("100 g", "DGHF-ISA-100", 100, "g", 179, 199),
      variant("200 g", "DGHF-ISA-200", 200, "g"),
      variant("500 g", "DGHF-ISA-500", 500, "g"),
    ],
  ),
  product(
    "Ashwagandha Churna",
    "ashwagandha-churna",
    "ayurvedic-wellness",
    "powder",
    "Ashwagandha powder for traditional use; botanical identity and licence are pending verification.",
    "Botanical identity, plant part, formulation and applicable licence must be verified. This draft does not claim to treat or prevent any condition.",
    [
      variant("100 g", "DGHF-ASH-100", 100, "g", 129, 149),
      variant("250 g", "DGHF-ASH-250", 250, "g"),
      variant("500 g", "DGHF-ASH-500", 500, "g"),
    ],
  ),
  product(
    "Shatavari Churna",
    "shatavari-churna",
    "ayurvedic-wellness",
    "powder",
    "Shatavari powder for traditional use; botanical identity and formulation await verification.",
    "Botanical identity, plant part, formulation, product directions and applicable licence must be verified before publication. No health outcomes are promised.",
    [
      variant("100 g", "DGHF-SHA-100", 100, "g", 149, 169),
      variant("250 g", "DGHF-SHA-250", 250, "g"),
      variant("500 g", "DGHF-SHA-500", 500, "g"),
    ],
  ),
  product(
    "Amla Bhringraj Hair Oil",
    "amla-bhringraj-hair-oil",
    "herbal-personal-care",
    "oil",
    "Hair and scalp care inspired by traditional Amla and Bhringraj practices.",
    "Actual ingredients, sourcing, application instructions and precautions must be verified. No guaranteed hair regrowth or disease-treatment claims are made.",
    [
      variant("100 ml", "DGHF-ABO-100", 100, "ml", 249, 299),
      variant("200 ml", "DGHF-ABO-200", 200, "ml"),
      variant("500 ml", "DGHF-ABO-500", 500, "ml"),
    ],
  ),
  product(
    "Herbal Hair Pack",
    "herbal-hair-pack",
    "herbal-personal-care",
    "powder",
    "Botanical hair-care preparation; ingredients, directions and precautions await verification.",
    "A preparation intended for hair-care routines. Confirm actual ingredients, application directions and precautions before publication. No treatment claims are made.",
    [
      variant("100 g", "DGHF-HP-100", 100, "g", 219, 249),
      variant("200 g", "DGHF-HP-200", 200, "g"),
    ],
  ),
  product(
    "Herbal Face Pack",
    "herbal-face-pack",
    "herbal-personal-care",
    "powder",
    "Botanical skincare preparation; ingredients, directions and precautions await verification.",
    "A preparation intended for skincare routines. Verify ingredients, directions and precautions before publication. No skin whitening, acne-treatment or pigmentation claims are made.",
    [
      variant("50 g", "DGHF-FP-050", 50, "g", 169, 199),
      variant("100 g", "DGHF-FP-100", 100, "g"),
    ],
  ),
  product(
    "Herbal Tooth Powder",
    "herbal-tooth-powder",
    "herbal-personal-care",
    "powder",
    "Traditional herbal oral-care product; ingredients, directions and classification await verification.",
    "The actual ingredient list, directions, warnings and applicable regulatory classification must be verified before publication. The 50 g price requires approval.",
    [
      variant("50 g", "DGHF-TP-050", 50, "g"),
      variant("100 g", "DGHF-TP-100", 100, "g", 129, 149),
    ],
  ),
].map((item, index) => ({
  ...item,
  image: placeholderImage(
    item.name,
    [12, 38, 46, 100, 43, 76, 53, 34, 87, 22, 65, 118, 5][index] ?? 35,
  ),
}));
