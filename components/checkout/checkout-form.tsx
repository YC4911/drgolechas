"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartSnapshot } from "@/types/cart";
import { addressSchema, type AddressInput } from "@/lib/auth/validation";

export interface SavedCheckoutAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

type CheckoutCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};
type OrderConfirmation = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  items: { name: string; quantity: number; total: number }[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
};
type OnlineCheckout = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentMode: "live" | "mock";
};
type CheckoutResponse = {
  data?: OrderConfirmation & Partial<OnlineCheckout>;
  error?: string;
  details?: { message?: string }[];
};
type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type CheckoutFormProps = {
  customer: CheckoutCustomer;
  addresses: SavedCheckoutAddress[];
  cart: CartSnapshot;
  onlinePaymentsEnabled: boolean;
  onlinePaymentMode: "live" | "mock" | "unavailable";
};

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      "razorpay-checkout",
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.id = "razorpay-checkout";
    script.async = true;
    script.onload = () =>
      window.Razorpay
        ? resolve()
        : reject(new Error("Razorpay checkout could not be loaded."));
    script.onerror = () =>
      reject(new Error("Razorpay checkout could not be loaded."));
    if (!existingScript) document.body.appendChild(script);
  });
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export function CheckoutForm({
  customer,
  addresses,
  cart,
  onlinePaymentsEnabled,
  onlinePaymentMode,
}: CheckoutFormProps) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const preferredAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0];
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(
    preferredAddress?.id ?? "new",
  );
  const [newAddress, setNewAddress] = useState<AddressInput>({
    label: "Home",
    recipientName: customer.name,
    phone: customer.phone,
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );
  const [mockCheckout, setMockCheckout] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);

  function updateAddress<K extends keyof AddressInput>(
    key: K,
    value: AddressInput[K],
  ) {
    setNewAddress((current) => ({ ...current, [key]: value }));
  }

  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (selectedAddress === "new") {
      const parsed = addressSchema.safeParse(newAddress);
      if (!parsed.success) {
        setError(
          parsed.error.issues[0]?.message ??
            "Check the shipping address details.",
        );
        return;
      }
      setNewAddress(parsed.data);
    }
    setStep(2);
  }

  async function placeOrder() {
    if (!cart.canCheckout) {
      setError(
        "Resolve cart availability or coupon issues before placing your order.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          paymentMethod,
          ...(selectedAddress === "new"
            ? { newAddress, saveAddress }
            : { addressId: selectedAddress }),
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (!response.ok || !result.data) {
        throw new Error(
          result.error ??
            result.details?.[0]?.message ??
            "We couldn’t place your order.",
        );
      }
      if (paymentMethod === "razorpay") {
        const data = result.data;
        if (!data.orderId) {
          throw new Error("Checkout did not return an order reference.");
        }
        if (data.paymentMode === "mock") {
          setMockCheckout({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
          });
          return;
        }
        if (!data.razorpayOrderId || !data.keyId) {
          throw new Error(
            "Online payment could not be started. No payment was taken.",
          );
        }
        await loadRazorpay();
        if (!window.Razorpay) {
          throw new Error(
            "Razorpay checkout could not be loaded. No payment was taken.",
          );
        }

        const checkout = new window.Razorpay({
          key: data.keyId,
          amount: data.amount ?? Math.round(data.total * 100),
          currency: data.currency ?? "INR",
          name: "Dr. Golechas",
          description: `Order ${data.orderNumber}`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
          theme: { color: "#35452A" },
          handler: (paymentResponse) => {
            void (async () => {
              setIsSubmitting(true);
              setError("");
              try {
                const verifyResponse = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(paymentResponse),
                });
                const verification = (await verifyResponse.json()) as {
                  data?: { orderId: string; status: string };
                  error?: string;
                };
                if (!verifyResponse.ok || !verification.data) {
                  throw new Error(
                    verification.error ??
                      "Payment verification is pending. Check your order status before paying again.",
                  );
                }
                if (verification.data.status === "paid") {
                  router.push(`/account/orders/${verification.data.orderId}`);
                  router.refresh();
                } else if (verification.data.status === "failed") {
                  setError(
                    "Razorpay confirmed that the payment failed. Your order has not been confirmed.",
                  );
                } else {
                  setError(
                    "Payment is still pending verification. Your order is not confirmed yet; check its status in your account.",
                  );
                }
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Payment verification is pending. Check your order status before paying again.",
                );
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
          modal: {
            ondismiss: () =>
              setError(
                "Payment window closed. Your payment status is pending; the order is not confirmed unless Razorpay verifies payment.",
              ),
          },
        });
        checkout.open();
      } else {
        setConfirmation(result.data);
        router.refresh();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checkout is temporarily unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitMockOutcome(outcome: "failed" | "cancelled") {
    if (!mockCheckout) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments/mock-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: mockCheckout.orderId,
          outcome,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Development simulation failed.");
      setMockCheckout(null);
      setError(
        outcome === "cancelled"
          ? "Development checkout cancelled. Payment remains unpaid and the order is cancelled."
          : "Development failure recorded. No payment occurred; this order was not paid.",
      );
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Development simulation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="border-line border-y py-14 text-center sm:py-20">
        <span className="bg-cream text-teal mx-auto grid size-14 place-items-center rounded-full">
          <Check aria-hidden="true" size={24} />
        </span>
        <h1 className="font-display text-teal mt-5 text-4xl">
          Order received.
        </h1>
        <p className="text-muted mt-3 text-sm">
          Order number {confirmation.orderNumber}
        </p>
        <p className="text-muted mt-2 text-sm">
          {formatPrice(confirmation.total)} ·{" "}
          {confirmation.paymentMethod === "cod"
            ? "Cash on delivery"
            : "Razorpay"}
        </p>
        <p className="text-muted mt-1 text-sm capitalize">
          Order status: {confirmation.orderStatus.replaceAll("_", " ")}
        </p>
        <div className="border-line mx-auto mt-6 max-w-xl border-y text-left">
          <h2 className="text-teal py-3 text-sm font-semibold">Products</h2>
          {confirmation.items.map((item, index) => (
            <p
              key={`${item.name}-${index}`}
              className="border-line flex justify-between gap-4 border-t py-2 text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.total)}</span>
            </p>
          ))}
          <h2 className="border-line text-teal border-t py-3 text-sm font-semibold">
            Shipping address
          </h2>
          <p className="text-muted pb-3 text-sm leading-6">
            {confirmation.shippingAddress.name},{" "}
            {confirmation.shippingAddress.line1}
            {confirmation.shippingAddress.line2
              ? `, ${confirmation.shippingAddress.line2}`
              : ""}
            , {confirmation.shippingAddress.city},{" "}
            {confirmation.shippingAddress.state}{" "}
            {confirmation.shippingAddress.postalCode}
          </p>
        </div>
        <Link
          href={`/account/orders/${confirmation.orderId}`}
          className="bg-teal mt-6 inline-flex min-h-11 items-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)]"
        >
          View order
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <div>
        <nav
          aria-label="Checkout steps"
          className="border-line grid grid-cols-3 border-y py-4 text-xs sm:text-sm"
        >
          {["Customer", "Shipping", "Review & payment"].map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-2 ${step === index ? "text-teal font-semibold" : "text-muted"}`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-[11px]">
                {index + 1}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </nav>

        {error ? (
          <p
            role="alert"
            className="mt-5 border border-[#a54535]/30 bg-[#fff7f4] p-3 text-sm text-[#8a3428]"
          >
            {error}
          </p>
        ) : null}

        {step === 0 ? (
          <section className="py-7">
            <h1 className="font-display text-teal text-3xl">
              Customer information
            </h1>
            <p className="text-muted mt-2 text-sm">
              Your order confirmation will use these account details.
            </p>
            <dl className="divide-line border-line mt-5 divide-y border-y text-sm">
              <div className="grid grid-cols-2 gap-4 py-3">
                <dt className="text-muted">Name</dt>
                <dd className="text-ink text-right font-medium">
                  {customer.name}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3">
                <dt className="text-muted">Email</dt>
                <dd className="text-ink text-right font-medium break-all">
                  {customer.email}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4 py-3">
                <dt className="text-muted">Phone</dt>
                <dd className="text-ink text-right font-medium">
                  {customer.phone}
                </dd>
              </div>
            </dl>
            <Link
              href="/account#profile"
              className="text-teal mt-3 inline-block text-xs font-medium hover:underline"
            >
              Edit account details
            </Link>
            <div className="mt-7 flex justify-end">
              <Button type="button" onClick={() => setStep(1)}>
                Continue to shipping <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <form onSubmit={continueToReview} className="py-7">
            <h1 className="font-display text-teal text-3xl">
              Shipping address
            </h1>
            <div className="mt-5 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 border p-4 ${selectedAddress === address.id ? "border-teal bg-cream/50" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="checkout-address"
                    value={address.id}
                    checked={selectedAddress === address.id}
                    onChange={() => setSelectedAddress(address.id)}
                    className="accent-teal mt-1"
                  />
                  <span className="text-ink text-sm leading-6">
                    <span className="font-semibold">
                      {address.label}
                      {address.isDefault ? " · Default" : ""} ·{" "}
                      {address.recipientName}
                    </span>
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    {address.landmark ? `, ${address.landmark}` : ""}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.phone}
                  </span>
                </label>
              ))}
              <label
                className={`text-teal flex cursor-pointer items-center gap-3 border p-4 text-sm font-semibold ${selectedAddress === "new" ? "border-teal bg-cream/50" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="checkout-address"
                  value="new"
                  checked={selectedAddress === "new"}
                  onChange={() => setSelectedAddress("new")}
                  className="accent-teal"
                />
                Use a new address
              </label>
            </div>

            {selectedAddress === "new" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  Name
                  <Input
                    value={newAddress.recipientName}
                    onChange={(event) =>
                      updateAddress("recipientName", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  Phone
                  <Input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(event) =>
                      updateAddress("phone", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium sm:col-span-2">
                  Address
                  <Input
                    value={newAddress.line1}
                    onChange={(event) =>
                      updateAddress("line1", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  Address line 2
                  <Input
                    value={newAddress.line2 ?? ""}
                    onChange={(event) =>
                      updateAddress("line2", event.target.value)
                    }
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  Landmark
                  <Input
                    value={newAddress.landmark ?? ""}
                    onChange={(event) =>
                      updateAddress("landmark", event.target.value)
                    }
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  City
                  <Input
                    value={newAddress.city}
                    onChange={(event) =>
                      updateAddress("city", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  State
                  <Input
                    value={newAddress.state}
                    onChange={(event) =>
                      updateAddress("state", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                  PIN code
                  <Input
                    inputMode="numeric"
                    pattern="[1-9][0-9]{5}"
                    value={newAddress.postalCode}
                    onChange={(event) =>
                      updateAddress("postalCode", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="text-ink flex items-center gap-2 self-end text-sm">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(event) => setSaveAddress(event.target.checked)}
                    className="accent-teal"
                  />
                  Save to my addresses
                </label>
              </div>
            ) : null}

            <div className="mt-7 flex justify-between">
              <Button type="button" variant="quiet" onClick={() => setStep(0)}>
                <ArrowLeft aria-hidden="true" size={16} /> Back
              </Button>
              <Button type="submit">
                Review order <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <section className="py-7">
            <h1 className="font-display text-teal text-3xl">
              Review & payment
            </h1>
            <div className="border-line mt-5 border-y py-4">
              <h2 className="text-ink text-sm font-semibold">Payment method</h2>
              <label className="text-ink mt-3 flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-teal"
                />{" "}
                Cash on Delivery
              </label>
              <label
                className={`mt-3 flex items-center gap-3 text-sm ${onlinePaymentsEnabled ? "text-ink cursor-pointer" : "text-muted cursor-not-allowed"}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "razorpay"}
                  disabled={!onlinePaymentsEnabled}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="accent-teal"
                />
                Pay online (UPI, cards, net banking)
              </label>
              {paymentMethod === "cod" ? (
                <p className="text-muted mt-2 text-xs">
                  Payment will be collected on delivery. This order is not
                  marked as paid.
                </p>
              ) : onlinePaymentMode === "mock" ? (
                <p className="mt-2 text-xs text-[var(--color-herbal-gold)]">
                  Development mock mode only: no payment is taken or marked
                  successful; you can simulate failure or cancellation.
                </p>
              ) : onlinePaymentsEnabled ? (
                <p className="text-muted mt-2 text-xs">
                  Razorpay will securely offer available payment methods.
                  Payment is confirmed only after server-side verification.
                </p>
              ) : (
                <p className="text-muted mt-2 text-xs">
                  Online payment is unavailable until Razorpay credentials are
                  configured. No simulated payment will be accepted.
                </p>
              )}
            </div>
            {mockCheckout ? (
              <div className="mt-5 border border-[var(--color-herbal-gold)]/40 bg-[var(--color-warm-ivory)] p-4">
                <h2 className="text-ink text-sm font-semibold">
                  Development payment simulation
                </h2>
                <p className="text-muted mt-2 text-xs leading-5">
                  Order {mockCheckout.orderNumber}. No gateway is connected, no
                  money can be collected, and this mode can never mark an order
                  as paid.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => void submitMockOutcome("failed")}
                  >
                    Simulate payment failure
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    disabled={isSubmitting}
                    onClick={() => void submitMockOutcome("cancelled")}
                  >
                    Cancel mock checkout
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="border-line mt-5 border-y py-4">
              <h2 className="text-ink text-sm font-semibold">Ship to</h2>
              {selectedAddress === "new" ? (
                <p className="text-muted mt-2 text-sm leading-6">
                  {newAddress.recipientName}, {newAddress.line1},{" "}
                  {newAddress.city}, {newAddress.state} {newAddress.postalCode}
                </p>
              ) : (
                <p className="text-muted mt-2 text-sm leading-6">
                  {
                    addresses.find((address) => address.id === selectedAddress)
                      ?.recipientName
                  }
                  ,{" "}
                  {
                    addresses.find((address) => address.id === selectedAddress)
                      ?.line1
                  }
                  ,{" "}
                  {
                    addresses.find((address) => address.id === selectedAddress)
                      ?.city
                  }
                </p>
              )}
            </div>
            <div className="mt-7 flex justify-between">
              <Button type="button" variant="quiet" onClick={() => setStep(1)}>
                <ArrowLeft aria-hidden="true" size={16} /> Back
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || !cart.canCheckout}
                onClick={() => void placeOrder()}
              >
                {isSubmitting
                  ? "Starting checkout…"
                  : paymentMethod === "cod"
                    ? "Place COD order"
                    : onlinePaymentMode === "mock"
                      ? "Start unpaid mock checkout"
                      : "Continue to secure payment"}
              </Button>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-6">
        <div className="border-line border p-5 sm:p-6">
          <h2 className="font-display text-teal text-2xl">Order summary</h2>
          <ul className="divide-line mt-4 max-h-64 divide-y overflow-y-auto">
            {cart.items.map((item) => (
              <li
                key={item.key}
                className="flex justify-between gap-3 py-3 text-sm"
              >
                <span className="text-ink">
                  {item.name}
                  {item.variantName ? ` · ${item.variantName}` : ""}{" "}
                  <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="text-ink shrink-0">
                  {formatPrice(item.lineSubtotal)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="border-line mt-3 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(cart.totals.subtotal)}</dd>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">Product savings</dt>
                <dd className="text-[var(--color-forest-olive)]">
                  −{formatPrice(cart.totals.discount)}
                </dd>
              </div>
            ) : null}
            {cart.totals.couponDiscount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">Coupon</dt>
                <dd className="text-[var(--color-forest-olive)]">
                  −{formatPrice(cart.totals.couponDiscount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">GST</dt>
              <dd>{formatPrice(cart.totals.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>
                {cart.totals.shipping === 0
                  ? "Free"
                  : formatPrice(cart.totals.shipping)}
              </dd>
            </div>
            <div className="border-line text-teal flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(cart.totals.total)}</dd>
            </div>
          </dl>
          {error ? (
            <p role="alert" className="mt-4 text-xs text-[#8a3428]">
              {error}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
