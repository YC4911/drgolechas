import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { newArrivals } from "@/lib/mock-products";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "New Arrivals",
  "See the latest additions to the Dr. Golechas collection.",
  "/new-arrivals",
);

export default function NewArrivalsPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Just arrived"
        title="New arrivals"
        description="Fresh additions to our considered collection of everyday essentials."
        level="h1"
      />
      <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
