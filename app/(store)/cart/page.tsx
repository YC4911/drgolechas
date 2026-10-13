import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/cart-page-view";
import { getCartOwner, getOrCreateCart } from "@/lib/cart/context";
import { buildCartSnapshot } from "@/lib/cart/service";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CartPage() {
  let initialCart = null;
  let initialError = "";

  try {
    const owner = await getCartOwner(false);
    if (owner) {
      const cart = await getOrCreateCart(owner);
      initialCart = await buildCartSnapshot(cart, owner);
    }
  } catch {
    initialError = "The cart is temporarily unavailable.";
  }

  return <CartPageView initialCart={initialCart} initialError={initialError} />;
}
