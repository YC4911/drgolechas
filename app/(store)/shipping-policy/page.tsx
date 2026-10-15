import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Shipping Policy",
  "Draft shipping information for Dr. Golechas orders.",
  "/shipping-policy",
);

export default function ShippingPolicyPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Customer care"
        title="Shipping policy"
        description="Shipping terms are communicated clearly before checkout and may be updated as service arrangements evolve."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>

      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
        <p>
          Orders are typically dispatched after confirmation of payment or order
          acceptance in accordance with the store&apos;s operational process.
          Final shipping charges, delivery timelines, and dispatch status may
          vary depending on the destination, product type, courier service, and
          order value.
        </p>
        <p>
          A proposed shipping configuration is currently in place for reference
          only: orders above ₹999 may qualify for complimentary shipping and
          orders below ₹999 may attract a nominal shipping fee of ₹79, subject
          to approval and final configuration by the business.
        </p>
        <p>
          Shipping charges and any free-shipping threshold are treated as
          configurable business settings and are not considered activated until
          approved for live sale. This means the live store may show updated
          pricing only after final approval.
        </p>
        <p>
          Customers are encouraged to provide accurate delivery information,
          including city, address, landmark, and PIN code, to minimise delays.
          If an item is delayed, cancelled, or cannot be delivered due to
          address or courier reasons, the team may contact the customer
          directly.
        </p>
      </div>
    </Container>
  );
}
