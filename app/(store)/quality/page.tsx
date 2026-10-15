import { createPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "Our Quality Promise",
  "Learn about the product information and quality principles behind Dr. Golechas.",
  "/quality",
);

const points = [
  "Responsible sourcing and transparent product information.",
  "Clear ingredient, usage, and safety guidance for each product.",
  "Careful handling of product records, packaging, and batch information where available.",
  "A commitment to accurate communication and ongoing review before public sale.",
];

export default function QualityPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Our promise"
        title="Quality with clarity"
        description="We believe quality begins with honest information, thoughtful process, and respect for the customer."
        level="h1"
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
          <p>
            Quality is not just a label. For us, it means reviewing ingredients,
            guidance, packaging information, and product communication with care
            before a product reaches the customer.
          </p>
          <p>
            Where batch information, manufacturing detail, or licensing records
            are available, we aim to make them visible and easy to understand.
            Where they are still pending, we clearly mark the status instead of
            guessing.
          </p>
        </div>
        <div className="rounded border border-[var(--color-natural-beige)] bg-[var(--color-warm-ivory)] p-6">
          <h2 className="font-display text-2xl text-[var(--color-botanical-charcoal)]">
            Our approach
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--color-botanical-charcoal)]">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 text-[var(--color-herbal-gold)]">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
