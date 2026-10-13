"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type VariantOption = {
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  packQuantity?: number;
  packUnit?: string;
  priceApproved?: boolean;
};

type AddToCartButtonProps = {
  productId: string;
  productName: string;
  sku?: string;
  stock?: number;
  variants?: VariantOption[];
  price?: number;
  mrp?: number;
  priceApproved?: boolean;
  availableForSale?: boolean;
  showBuyNow?: boolean;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export function AddToCartButton({
  productId,
  productName,
  sku = "",
  stock = 0,
  variants = [],
  price = 0,
  mrp = 0,
  priceApproved = true,
  availableForSale = true,
  showBuyNow = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [variantSku, setVariantSku] = useState(variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const selectedVariant = variants.find(({ sku }) => sku === variantSku);
  const selectedPrice = selectedVariant?.price ?? price;
  const selectedMrp = selectedVariant?.mrp ?? mrp;
  const selectedPriceApproved =
    selectedVariant?.priceApproved !== false && priceApproved;
  const available = selectedVariant?.stock ?? stock;
  const canPurchase =
    availableForSale &&
    selectedPriceApproved &&
    selectedPrice > 0 &&
    available > 0;

  async function add(buyNow = false) {
    setIsAdding(true);
    setMessage("");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...(variantSku ? { variantSku } : {}),
          quantity,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const error =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "This item could not be added.";
        setMessage(error);
        return;
      }
      setMessage(`${productName} added to cart.`);
      if (buyNow) router.push("/checkout");
    } catch {
      setMessage("The cart is temporarily unavailable.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="mt-4">
      {variants.length > 0 ? (
        <label className="text-ink mb-2 block text-xs font-medium">
          Choose an option
          <Select
            className="mt-1"
            value={variantSku}
            onChange={(event) => {
              setVariantSku(event.target.value);
              setQuantity(1);
            }}
          >
            {variants.map((variant) => (
              <option key={variant.sku} value={variant.sku}>
                {variant.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      <p className="text-muted mb-2 text-xs">
        SKU: {selectedVariant?.sku ?? sku}
      </p>
      {selectedPriceApproved && selectedPrice > 0 ? (
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <span className="text-teal text-lg font-semibold">
            {formatPrice(selectedPrice)}
          </span>
          {selectedMrp > selectedPrice ? (
            <>
              <span className="text-muted text-xs line-through">
                {formatPrice(selectedMrp)}
              </span>
              <span className="text-xs font-medium text-[#7c5a1c]">
                Save {formatPrice(selectedMrp - selectedPrice)} (
                {Math.round(
                  ((selectedMrp - selectedPrice) / selectedMrp) * 100,
                )}
                % off)
              </span>
            </>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 text-sm font-medium text-[#7c5a1c]">
          Price pending approval
        </p>
      )}
      {canPurchase ? (
        <label className="text-ink mb-3 block text-xs font-medium">
          Quantity
          <input
            type="number"
            min={1}
            max={Math.min(99, available)}
            value={quantity}
            onChange={(event) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(
                    Math.min(99, available),
                    Number.parseInt(event.target.value, 10) || 1,
                  ),
                ),
              )
            }
            className="border-line mt-1 min-h-10 w-full rounded border px-3"
          />
        </label>
      ) : null}
      {!availableForSale ? (
        <p className="mb-3 text-sm font-medium text-[#7c5a1c]">
          Unavailable — pending product approval
        </p>
      ) : selectedPriceApproved && available <= 0 ? (
        <p className="text-muted mb-3 text-sm">Currently out of stock</p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 w-full text-xs"
        disabled={isAdding || !canPurchase}
        onClick={() => void add()}
        aria-label={`Add ${productName} to cart`}
      >
        {isAdding ? "Adding…" : "Add to Cart"}
      </Button>
      {showBuyNow ? (
        <Button
          type="button"
          className="mt-2 min-h-10 w-full text-xs"
          disabled={isAdding || !canPurchase}
          onClick={() => void add(true)}
        >
          Buy Now
        </Button>
      ) : null}
      {message ? (
        <p role="status" aria-live="polite" className="text-muted mt-2 text-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}
