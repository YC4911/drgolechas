import { createPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "Frequently Asked Questions",
  "Find answers about Dr. Golechas products, orders, delivery, and support.",
  "/faq",
);

const questions = [
  [
    "What does Dr. Golecha's Herbal Farm offer?",
    "The store focuses on herbal wellness, traditional Ayurvedic preparations, natural food items, and botanical personal-care essentials.",
  ],
  [
    "Do you offer shipping across India?",
    "Shipping availability and delivery timelines are confirmed at checkout and may vary according to order value, destination, and service partner availability.",
  ],
  [
    "How can I contact customer support?",
    "You can reach us by phone at 9762373730 or by email at brahmanathpharma@gmail.com. Product and order-related questions are also shared through our contact page.",
  ],
  [
    "Are product claims verified before listing?",
    "We aim to communicate product information clearly and accurately. Product claims are reviewed against available formulation, licensing, and packaging information before listing in line with responsible selling practices.",
  ],
  [
    "Do you offer returns or replacements?",
    "Returns, replacements, and refunds are governed by the policy published on this site and may depend on product condition, order status, and the nature of the issue. More details are available on the returns and policy pages.",
  ],
];

export default function FaqPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="A little help"
        title="Frequently asked questions"
        description="A few answers about our herbal wellness range and service approach."
        level="h1"
      />
      <div className="divide-line border-line mt-8 max-w-3xl divide-y border-y">
        {questions.map(([question, answer]) => (
          <details key={question} className="group py-5">
            <summary className="text-teal flex cursor-pointer items-center justify-between gap-4 font-medium">
              {question}
              <span
                aria-hidden="true"
                className="text-gold text-xl group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-muted mt-3 max-w-2xl text-sm leading-6">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </Container>
  );
}
