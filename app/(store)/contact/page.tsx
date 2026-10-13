import { createPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata(
  "Contact Us",
  "Contact Dr. Golechas for help with products, orders, and customer support.",
  "/contact",
);

export default function ContactPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="We are here to help"
        title="Contact us"
        description="Reach out for product information, order assistance, or customer support."
        level="h1"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border border-[#e3e7e1] bg-[#f9f7f1] p-6 text-sm text-[#425554]">
          <h2 className="font-display text-2xl text-[#18343a]">
            Customer care
          </h2>
          <ul className="mt-5 space-y-4">
            <li>
              <span className="block text-xs font-semibold tracking-[0.14em] text-[#8c6a2d] uppercase">
                Phone
              </span>
              <a
                href="tel:9762373730"
                className="mt-1 block text-base font-medium text-[#18343a] hover:underline"
              >
                9762373730
              </a>
            </li>
            <li>
              <span className="block text-xs font-semibold tracking-[0.14em] text-[#8c6a2d] uppercase">
                Email
              </span>
              <a
                href="mailto:brahmanathpharma@gmail.com"
                className="mt-1 block text-base font-medium text-[#18343a] hover:underline"
              >
                brahmanathpharma@gmail.com
              </a>
            </li>
            <li>
              <span className="block text-xs font-semibold tracking-[0.14em] text-[#8c6a2d] uppercase">
                Address
              </span>
              <span className="mt-1 block text-base text-[#18343a]">
                At Post Poonatgaon, Taluka Newasa, District Ahilyanagar,
                Maharashtra, India
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded border border-[#e3e7e1] bg-white p-6 text-sm text-[#425554]">
          <p>
            For general enquiries, product questions, and order support, please
            contact us using the details above. We typically respond as quickly
            as possible and appreciate a clear note with your order number or
            product details where relevant.
          </p>
          <div className="mt-5 border-t border-[#e3e7e1] pt-5">
            <p className="font-semibold text-[#18343a]">
              Before you write to us
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Include your order number or product name for faster help.
              </li>
              <li>Share your city or PIN code for shipping questions.</li>
              <li>
                Use the contact details above for product and policy queries.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}
