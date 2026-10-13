import { createHash } from "node:crypto";
import type { CartRecord } from "@/models/cart";

export function fingerprintCart(
  cart: Pick<CartRecord, "items" | "couponCode">,
): string {
  const contents = {
    items: cart.items.map((item) => ({
      product: item.product.toString(),
      variantSku: item.variantSku?.toUpperCase() ?? null,
      quantity: item.quantity,
    })),
    couponCode: cart.couponCode?.toUpperCase() ?? null,
  };
  return createHash("sha256").update(JSON.stringify(contents)).digest("hex");
}
