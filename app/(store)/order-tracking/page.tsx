import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Order Tracking",
  robots: { index: false, follow: false },
};

export default function OrderTrackingPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <SectionHeading
        eyebrow="Support"
        title="Order tracking"
        description="Track your order once it is dispatched and confirmed by the store team."
        level="h1"
      />
      <div className="mt-8 max-w-3xl space-y-5 text-sm leading-7 text-[#425554]">
        <p>
          Once an order has been confirmed and dispatched, customers may receive
          shipping details, courier information, and a tracking reference from
          the fulfillment partner.
        </p>
        <p>
          Typical order updates include confirmation, shipment dispatch,
          delivery in transit, and final delivery confirmation. If there is a
          delay or service issue, the customer care team can assist with the
          order status.
        </p>
        <p>
          To request tracking support, please keep the order number and contact
          details available. If the order is still under processing or payment
          review, the status may not yet be available for live courier tracking.
        </p>
      </div>
    </Container>
  );
}
