import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LegalContentNotice } from "@/components/legal/legal-content-notice";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Terms and Conditions",
  "Draft terms for using the Dr. Golechas online store.",
  "/terms",
);

export default function TermsPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Policies"
        title="Terms of service"
        description="These terms govern website browsing, order placement, and customer communication."
        level="h1"
      />
      <div className="mt-6 max-w-3xl">
        <LegalContentNotice />
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
        <p>
          By accessing and using this website, customers agree to use the store
          responsibly and only for lawful purposes. Product information,
          promotional content, pricing, and service terms may be revised as
          business operations and approvals evolve.
        </p>
        <p>
          Product descriptions are intended to inform the customer and should
          not be treated as medical, therapeutic, or diagnostic guidance unless
          expressly permitted under the relevant product classification and
          approved claims. Any order placed is subject to confirmation, stock
          validation, and operational review.
        </p>
        <p>
          We reserve the right to refuse or cancel orders where the information
          provided is incomplete, inaccurate, or inconsistent with store
          policies. Customers remain responsible for ensuring the correctness of
          their delivery details and product selection.
        </p>
        <p>
          The website and store content are provided for informational and
          shopping purposes. The business may amend policies or product listings
          from time to time, and continued use of the store following updates
          indicates acceptance of the revised terms.
        </p>
      </div>
    </Container>
  );
}
