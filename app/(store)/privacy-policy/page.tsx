import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Privacy Policy",
  "Draft privacy information for Dr. Golechas customers.",
  "/privacy-policy",
);

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Policies"
        title="Privacy policy"
        description="This policy explains how we handle customer information responsibly and transparently."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
        <p>
          Dr. Golecha&apos;s Herbal Farm respects the privacy of its customers
          and takes reasonable steps to protect personal information collected
          through the website, order flow, and support channels. Information may
          include contact details, shipping address, payment status references,
          and order-related communications.
        </p>
        <p>
          We use personal data to process orders, provide support, improve the
          customer experience, and maintain account details where relevant. We
          do not sell or trade personal information to third parties for
          marketing purposes without clear consent where required.
        </p>
        <p>
          Where payment processing is handled by a service provider, card or
          payment details are not stored directly by the storefront unless a
          secure payment provider is explicitly configured. Customer account
          records are limited to what is necessary for order support, customer
          identity, and service communication.
        </p>
        <p>
          We may keep records for order history, support requests, compliance
          obligations, and operational reporting. Customers may contact the
          business to request information about their account, correct
          inaccurate personal data, or ask about retention practices.
        </p>
      </div>
    </Container>
  );
}
