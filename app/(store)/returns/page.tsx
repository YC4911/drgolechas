import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Returns, Refunds and Replacement Policy",
  "Draft returns and refund information for Dr. Golechas orders.",
  "/returns",
);

export default function ReturnsPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Policies"
        title="Returns, refunds and replacements"
        description="We aim to make resolution simple and transparent when a product is damaged, incorrect, or not as described."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
        <p>
          Customers may request support for damaged, incorrect, or incomplete
          deliveries. Replacement or refund requests are handled on a
          case-by-case basis and depend on the product condition, order status,
          and the evidence provided.
        </p>
        <p>
          We recommend checking the product on arrival and contacting customer
          support promptly if there is a delivery issue, visible damage, or
          mismatch in the item received. Accurate order details, product name,
          image evidence (where relevant), and delivery information help us
          resolve concerns faster.
        </p>
        <p>
          Perishable or sensitive products may be subject to additional handling
          conditions. We do not treat damaged packaging alone as proof of
          product fault without appropriate review. For health, safety, or
          quality concerns, the customer should contact the business with the
          batch or packaging details available.
        </p>
        <p>
          Final return, replacement, and refund rules are applied in line with
          the operational policy and any applicable business approval at the
          time of order processing. For exact terms relevant to a specific
          order, please contact the support team.
        </p>
      </div>
    </Container>
  );
}
