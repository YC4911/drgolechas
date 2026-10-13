import { ProductFinder } from "@/components/product/product-finder";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/seo/page-metadata";
import { getFinderOptions } from "@/services/recommendation";

export const metadata = createPageMetadata(
  "Product finder",
  "Answer a few questions to explore products that match your preferences and budget.",
  "/product-finder",
);

export default async function ProductFinderPage() {
  const options = await getFinderOptions();
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#8c6a2d] uppercase">
          A considered place to start
        </p>
        <h1 className="font-display mt-3 text-4xl text-[#083847] sm:text-5xl">
          Find products for you
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#68787a] sm:text-base">
          Tell us what you are looking for. We will match your selections with
          product details, availability, and budget.
        </p>
        <ProductFinder options={options} />
        <p className="mt-8 text-center text-xs leading-5 text-[#68787a]">
          This product finder is for shopping discovery only. It does not
          provide medical advice, diagnoses, or treatment recommendations and
          does not replace a qualified healthcare professional.
        </p>
      </div>
    </Container>
  );
}
