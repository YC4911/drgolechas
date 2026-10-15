import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "About Us",
  "Learn about Dr. Golechas and our herbal farm, wellness, and personal care collections.",
  "/about",
);

const principles = [
  "Farm-inspired herbal wellness rooted in Indian traditions.",
  "Thoughtful product selection with practical, transparent information.",
  "A clear focus on quality, trust, and customer education.",
  "A considered approach to natural foods, wellness, and personal care.",
];

export default function AboutPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Our story"
        title="Dr. Golecha's Herbal Farm"
        description="A calm, natural range of herbal wellness, traditional formulations, and everyday essentials inspired by the rhythm of farm life."
        level="h1"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
          <p>
            Dr. Golecha&apos;s Herbal Farm brings together traditional Ayurvedic
            inspiration, herbal wellness, and natural food essentials in one
            considered collection for modern life.
          </p>
          <p>
            Based in Maharashtra, India, the brand blends the values of
            farm-inspired sourcing, practical daily rituals, and clear product
            information. The aim is simple: offer a trustworthy range of natural
            products that help customers build mindful routines without
            unnecessary complexity.
          </p>
          <p>
            Every product is approached with care, transparency, and a respect
            for the details that matter: ingredients, guidance, quality, and
            responsible communication. We believe wellness should be clear,
            grounded, and easy to understand.
          </p>
        </div>

        <div className="rounded border border-[var(--color-natural-beige)] bg-[var(--color-warm-ivory)] p-6">
          <h2 className="font-display text-2xl text-[var(--color-botanical-charcoal)]">
            What we value
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--color-botanical-charcoal)]">
            {principles.map((principle) => (
              <li key={principle} className="flex gap-3">
                <span className="mt-1 text-[var(--color-herbal-gold)]">•</span>
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
