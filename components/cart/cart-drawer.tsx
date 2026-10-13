"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CartSnapshot } from "@/types/cart";

type CartResponse = { data?: CartSnapshot | null; error?: string };

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

async function readCartResponse(response: Response): Promise<CartSnapshot> {
  const payload = (await response.json()) as CartResponse;
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Cart is temporarily unavailable.");
  }
  return payload.data;
}

export function CartDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [error, setError] = useState("");

  async function refreshCart() {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      setCart(await readCartResponse(response));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart is unavailable.");
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function mutateLine(
    item: CartSnapshot["items"][number],
    method: "PATCH" | "DELETE",
    quantity?: number,
  ) {
    try {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          variantSku: item.variantSku ?? undefined,
          ...(quantity === undefined ? {} : { quantity }),
        }),
      });
      setCart(await readCartResponse(response));
      setError("");
      window.dispatchEvent(new Event("dg-cart-updated"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart update failed.");
    }
  }

  const count = cart?.itemCount ?? 0;

  return (
    <>
      <button
        type="button"
        aria-label={`Shopping cart, ${count} items`}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          void refreshCart();
        }}
        className="relative grid size-10 place-items-center rounded-sm text-teal transition-colors hover:bg-cream"
      >
        <ShoppingBag aria-hidden="true" size={19} />
        {count > 0 ? (
          <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-teal">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Shopping cart"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(100vw,28rem)] max-w-none border-0 bg-paper p-0 text-ink shadow-2xl backdrop:bg-teal/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-2xl text-teal">Your cart</h2>
              <p className="mt-1 text-xs text-muted">{count} item(s)</p>
            </div>
            <button
              type="button"
              aria-label="Close cart"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-sm text-teal hover:bg-cream"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          {error ? (
            <p role="alert" className="m-5 border border-[#a54535]/30 bg-[#fff7f4] p-3 text-sm text-[#8a3428]">
              {error}
            </p>
          ) : null}

          {cart && cart.items.length > 0 ? (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {cart.items.map((item) => (
                  <li key={item.key} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        {item.variantName ? (
                          <p className="mt-1 text-xs text-muted">{item.variantName}</p>
                        ) : null}
                        {item.status !== "available" ? (
                          <p className="mt-1 text-xs text-[#8a3428]">{item.status === "out-of-stock" ? "Quantity exceeds available stock" : "Unavailable"}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-teal">
                        {formatPrice(item.lineSubtotal)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => void mutateLine(item, item.quantity <= 1 ? "DELETE" : "PATCH", item.quantity - 1)}
                        className="grid size-8 place-items-center rounded-sm border border-line text-teal hover:bg-cream"
                      >
                        <Minus aria-hidden="true" size={14} />
                      </button>
                      <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={item.quantity >= 99 || item.quantity >= item.available}
                        onClick={() => void mutateLine(item, "PATCH", item.quantity + 1)}
                        className="grid size-8 place-items-center rounded-sm border border-line text-teal hover:bg-cream disabled:opacity-40"
                      >
                        <Plus aria-hidden="true" size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void mutateLine(item, "DELETE")}
                        className="ml-auto grid size-8 place-items-center rounded-sm text-muted hover:bg-cream hover:text-teal"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total</span>
                  <span className="font-semibold text-teal">{formatPrice(cart.totals.total)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-sm border border-teal/30 text-sm font-semibold text-teal hover:bg-cream"
                  >
                    View cart
                  </Link>
                  <Link
                    href="/checkout"
                    aria-disabled={!cart.canCheckout}
                    onClick={(event) => {
                      if (!cart.canCheckout) event.preventDefault();
                      else setOpen(false);
                    }}
                    className={`inline-flex min-h-11 items-center justify-center rounded-sm bg-teal text-sm font-semibold text-white hover:bg-[#0c4b5b] ${cart.canCheckout ? "" : "pointer-events-none opacity-50"}`}
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <ShoppingBag aria-hidden="true" className="text-gold" size={30} />
              <h3 className="mt-4 font-display text-2xl text-teal">Your cart is empty.</h3>
              <p className="mt-2 text-sm text-muted">Find something thoughtful for your everyday.</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-teal px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
              >
                Browse the collection
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}