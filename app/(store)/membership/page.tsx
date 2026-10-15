import { createPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "Membership and Rewards",
  "Discover membership and rewards information for Dr. Golechas customers.",
  "/membership",
);

export default function MembershipPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Customer community"
        title="Membership & rewards"
        description="A proposed membership programme is being developed to offer selected benefits with clear terms and permissions."
        level="h1"
      />
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
        <p>
          A three-month conscious wellness pass and related rewards options are
          being considered as proposals. Any active programme will be announced
          only when the business has approved the membership rules, pricing,
          benefits, and renewal terms.
        </p>
        <p>
          Potential benefits may include member pricing on selected products,
          early access to limited bundles, farm updates, and loyalty
          recognition. None of these benefits are guaranteed until the programme
          is formally launched with explicit eligibility and renewal
          information.
        </p>
        <p>
          We do not plan to introduce automatic recurring payments or silent fee
          changes without clear consent and transparent implementation.
          Membership details, term dates, benefit conditions, and any renewal
          mechanics will be communicated before enrolment.
        </p>
      </div>
    </Container>
  );
}
