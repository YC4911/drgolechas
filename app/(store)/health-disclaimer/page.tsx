import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Health and Product Disclaimer",
  "Important information about health claims and product content.",
  "/health-disclaimer",
);

export default function HealthDisclaimerPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Important information"
        title="Health and product disclaimer"
        description="The information on this website is for general education and retail guidance, not diagnosis or treatment."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[#425554]">
        <p>
          Product information on this website is offered to support informed
          shopping decisions. It is not a substitute for professional medical
          advice, diagnosis, or treatment.
        </p>
        <p>
          Herbal and Ayurvedic products may have traditional or cultural
          associations, but product claims must be reviewed against the approved
          formulation, applicable classification, legal requirements, and
          available evidence before any medical or therapeutic statement is
          made.
        </p>
        <p>
          Customers with medical conditions, pregnancy, postnatal care concerns,
          children&apos;s use requirements, or known allergies should check
          ingredient information carefully and consult a qualified healthcare
          professional before use where appropriate.
        </p>
      </div>
    </Container>
  );
}
