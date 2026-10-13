import { createPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "Terms of Conscious Service",
  "Draft terms for using the Dr. Golechas online store.",
  "/terms-of-conscious-service",
);

export default function TermsOfConsciousServicePage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Service philosophy"
        title="Terms of conscious service"
        description="We aim to serve with clarity, respect, and thoughtful attention to customer needs."
        level="h1"
      />
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[#425554]">
        <p>
          Our service approach is grounded in respect, transparency, and
          practical communication. We aim to support customers with honest
          guidance, helpful product information, and clear service standards.
        </p>
        <p>
          We do not make unsupported health claims or promise results that
          cannot be substantiated. We prefer a measured, responsible style of
          service that values education, product clarity, and informed choice.
        </p>
      </div>
    </Container>
  );
}
