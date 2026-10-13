import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Cancellation Policy",
  "Draft order cancellation information for Dr. Golechas.",
  "/cancellation-policy",
);

export default function CancellationPolicyPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Policies"
        title="Cancellation policy"
        description="Orders may be cancelled before dispatch or processing begins, subject to the final operational policy."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[#425554]">
        <p>
          If an order is cancelled before dispatch, the request may be accepted
          depending on the order stage and the store&apos;s operational
          timeline. Once an item has entered the dispatch or fulfillment
          workflow, cancellation may no longer be possible.
        </p>
        <p>
          Payment refund timing depends on the original payment channel and the
          final approved order status. For further support, customers should
          contact the support team with their order number and confirmation
          details.
        </p>
      </div>
    </Container>
  );
}
