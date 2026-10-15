import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentCustomer } from "@/lib/auth/session";
import { buildCartSnapshot } from "@/lib/cart/service";
import { CartModel } from "@/models/cart";
import { AddressModel } from "@/models/address";
import type { CartOwner } from "@/lib/cart/context";
import { getRazorpayCheckoutMode } from "@/lib/payments/razorpay";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=%2Fcheckout");

  const owner: CartOwner = {
    kind: "user",
    userId: customer.id,
    filter: { user: customer.id },
  };
  const cart = await CartModel.findOne({ user: customer.id }).exec();
  if (!cart || cart.items.length === 0) redirect("/cart");
  const paymentMode = getRazorpayCheckoutMode();

  const [snapshot, addresses] = await Promise.all([
    buildCartSnapshot(cart, owner),
    AddressModel.find({ user: customer.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .select(
        "label recipientName phone line1 line2 landmark city state postalCode country isDefault",
      )
      .lean()
      .exec(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-herbal-gold)] uppercase">
        Secure checkout
      </p>
      <h1 className="font-display text-teal mt-2 text-4xl">
        Complete your order
      </h1>
      <p className="text-muted mt-2 text-sm">
        Prices, availability, GST, shipping, and coupons are revalidated when
        you place your order.
      </p>
      <div className="mt-7">
        <CheckoutForm
          customer={customer}
          cart={snapshot}
          onlinePaymentsEnabled={paymentMode !== "unavailable"}
          onlinePaymentMode={paymentMode}
          addresses={addresses.map((address) => ({
            id: address._id.toString(),
            label: address.label,
            recipientName: address.recipientName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            isDefault: address.isDefault,
          }))}
        />
      </div>
    </div>
  );
}
