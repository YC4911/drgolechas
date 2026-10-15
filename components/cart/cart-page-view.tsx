"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { isNextImageSourceConfigured } from "@/lib/images";
import type { CartSnapshot } from "@/types/cart";

type CartResponse = { data?: CartSnapshot | null; error?: string };
type CartPageViewProps = {
  initialCart: CartSnapshot | null;
  initialError?: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export function CartPageView({
  initialCart,
  initialError = "",
}: CartPageViewProps) {
  const [cart, setCart] = useState<CartSnapshot | null>(initialCart);
  const [coupon, setCoupon] = useState(initialCart?.couponCode ?? "");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadCart() {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = (await response.json()) as CartResponse;
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Cart is temporarily unavailable.");
      }
      setCart(result.data);
      setCoupon(result.data.couponCode ?? "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function mutateLine(
    productId: string,
    variantSku: string | null,
    method: "PATCH" | "DELETE",
    quantity?: number,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...(variantSku ? { variantSku } : {}),
          ...(quantity === undefined ? {} : { quantity }),
        }),
      });
      const result = (await response.json()) as CartResponse;
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Cart update failed.");
      }
      setCart(result.data);
      setNotice("Cart updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon }),
      });
      const result = (await response.json()) as CartResponse;
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Coupon could not be applied.");
      }
      setCart(result.data);
      setCoupon(result.data.couponCode ?? "");
      setNotice("Coupon applied.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Coupon could not be applied.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeCoupon() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/cart/coupon", { method: "DELETE" });
      const result = (await response.json()) as CartResponse;
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Coupon could not be removed.");
      }
      setCart(result.data);
      setCoupon("");
      setNotice("Coupon removed.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Coupon could not be removed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Container className="py-10 sm:py-14">
        <LoadingSkeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <LoadingSkeleton key={item} className="h-28" />
            ))}
          </div>
          <LoadingSkeleton className="h-72" />
        </div>
      </Container>
    );
  }

  if (error && !cart) {
    return (
      <Container className="py-10 sm:py-14">
        <div role="alert" className="border-line border-y py-10">
          <h1 className="font-display text-teal text-3xl">
            Your cart is unavailable.
          </h1>
          <p className="text-muted mt-2 text-sm">{error}</p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => void loadCart()}
          >
            Try again
          </Button>
        </div>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-10 sm:py-14">
        <h1 className="font-display text-teal mb-4 text-4xl">Shopping cart</h1>
        <div className="border-line border-y">
          <EmptyState
            title="Your cart is taking a breather."
            description="Items you add will be waiting here."
            action={
              <Link
                href="/shop"
                className="bg-teal inline-flex min-h-11 items-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)]"
              >
                Browse the collection
              </Link>
            }
          />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-teal text-4xl">Shopping cart</h1>
      <p className="text-muted mt-2 text-sm">
        {cart.itemCount} item(s) in your cart
      </p>
      {error ? (
        <p
          role="alert"
          className="mt-4 border border-[#a54535]/30 bg-[#fff7f4] p-3 text-sm text-[#8a3428]"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="border-line bg-cream text-teal mt-4 border p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <ul className="divide-line border-line divide-y border-y">
          {cart.items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5 sm:gap-6">
              {item.image ? (
                <div className="bg-cream relative size-24 shrink-0 overflow-hidden rounded-sm sm:size-28">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="112px"
                    unoptimized={!isNextImageSourceConfigured(item.image)}
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <Link
                  href={
                    item.slug
                      ? `/product/${encodeURIComponent(item.slug)}`
                      : "/shop"
                  }
                  className="text-ink hover:text-teal font-medium"
                >
                  {item.name}
                </Link>
                {item.variantName ? (
                  <p className="text-muted mt-1 text-xs">{item.variantName}</p>
                ) : null}
                {item.status !== "available" ? (
                  <p className="mt-1 text-xs text-[#8a3428]">
                    {item.status === "out-of-stock"
                      ? `Only ${item.available} available`
                      : "Currently unavailable"}
                  </p>
                ) : null}
                <p className="text-teal mt-2 text-sm font-semibold">
                  {formatPrice(item.unitPrice)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={busy}
                    onClick={() =>
                      void mutateLine(
                        item.productId,
                        item.variantSku,
                        item.quantity <= 1 ? "DELETE" : "PATCH",
                        item.quantity - 1,
                      )
                    }
                    className="border-line text-teal hover:bg-cream grid size-9 place-items-center rounded-sm border disabled:opacity-50"
                  >
                    <Minus aria-hidden="true" size={15} />
                  </button>
                  <span className="min-w-6 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={
                      busy ||
                      item.quantity >= 99 ||
                      item.quantity >= item.available
                    }
                    onClick={() =>
                      void mutateLine(
                        item.productId,
                        item.variantSku,
                        "PATCH",
                        item.quantity + 1,
                      )
                    }
                    className="border-line text-teal hover:bg-cream grid size-9 place-items-center rounded-sm border disabled:opacity-50"
                  >
                    <Plus aria-hidden="true" size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void mutateLine(item.productId, item.variantSku, "DELETE")
                    }
                    className="text-muted hover:text-teal ml-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" size={14} /> Remove
                  </button>
                </div>
              </div>
              <p className="text-teal hidden shrink-0 text-sm font-semibold sm:block">
                {formatPrice(item.lineSubtotal)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-6">
          <div className="border-line border p-5 sm:p-6">
            <h2 className="font-display text-teal text-2xl">Order summary</h2>
            <form onSubmit={applyCoupon} className="mt-5 flex gap-2">
              <label htmlFor="cart-coupon" className="sr-only">
                Coupon code
              </label>
              <Input
                id="cart-coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Coupon code"
                maxLength={64}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={busy || !coupon.trim()}
              >
                Apply
              </Button>
            </form>
            {cart.couponCode ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeCoupon()}
                className="text-teal mt-2 text-xs underline"
              >
                Remove {cart.couponCode}
              </button>
            ) : null}
            {cart.couponError ? (
              <p role="alert" className="mt-2 text-xs text-[#8a3428]">
                {cart.couponError}
              </p>
            ) : null}
            <dl className="border-line mt-5 space-y-3 border-t pt-4 text-sm">
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
                  <dt className="text-muted">Coupon discount</dt>
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
            <Link
              href="/checkout"
              aria-disabled={!cart.canCheckout}
              className={`bg-teal mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)] ${cart.canCheckout ? "" : "pointer-events-none opacity-50"}`}
            >
              Continue to checkout
            </Link>
            {!cart.canCheckout ? (
              <p className="text-muted mt-2 text-xs">
                Resolve unavailable items or coupon issues to continue.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </Container>
  );
}
