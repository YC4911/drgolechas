import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Disclaimer",
  "Important information about product details, website content, and shopping guidance.",
  "/disclaimer",
);

export default function DisclaimerPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Important information"
        title="Disclaimer"
        description="Website and product information is provided for general shopping purposes."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[#425554]">
        <p>
          Product descriptions, ingredients, availability, prices, and imagery
          are provided to help customers make shopping decisions. Check the
          product label and packaging for the most current information.
        </p>
        <p>
          Website content is not medical advice and does not diagnose, treat, or
          prevent a health condition. Consult a qualified healthcare
          professional for individual health advice.
        </p>
        <p>
          Replace this draft with business-approved information and obtain
          appropriate legal review before production use.
        </p>
      </div>
    </Container>
  );
}
