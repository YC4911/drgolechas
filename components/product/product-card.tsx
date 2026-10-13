import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { isNextImageSourceConfigured } from "@/lib/images";

type ProductCardProps = {
  product: Product;
  detailHref?: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export function ProductCard({ product, detailHref }: ProductCardProps) {
  const hasApprovedPrice = product.priceApproved !== false;
  const discount =
    hasApprovedPrice && product.mrp > 0 && product.sellingPrice < product.mrp
      ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
      : 0;

  return (
    <article className="group min-w-0">
      <div className="bg-cream relative aspect-[4/4.6] overflow-hidden rounded-sm">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          unoptimized={!isNextImageSourceConfigured(product.image)}
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
        {product.badge ? (
          <Badge className="absolute top-3 left-3">{product.badge}</Badge>
        ) : null}
        {detailHref ? (
          <Link
            href={detailHref}
            aria-label={`View ${product.name}`}
            className="bg-paper text-teal hover:bg-teal absolute right-3 bottom-3 grid size-10 place-items-center rounded-full opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:text-white focus-visible:opacity-100"
          >
            <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={`View ${product.name}`}
            className="bg-paper text-teal hover:bg-teal absolute right-3 bottom-3 grid size-10 place-items-center rounded-full opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:text-white focus-visible:opacity-100"
          >
            <ArrowUpRight aria-hidden="true" size={18} />
          </button>
        )}
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted text-xs">{product.category}</p>
          <p className="text-ink flex shrink-0 items-center gap-1 text-xs">
            <Star
              aria-hidden="true"
              className="fill-gold text-gold"
              size={13}
            />
            {product.rating.toFixed(1)}{" "}
            <span className="text-muted">({product.reviewCount})</span>
          </p>
        </div>
        <h3 className="text-ink mt-1 truncate font-medium">
          {detailHref ? (
            <Link href={detailHref} className="hover:text-teal">
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          {hasApprovedPrice && product.sellingPrice > 0 ? (
            <>
              <span className="text-teal text-sm font-semibold">
                {formatPrice(product.sellingPrice)}
              </span>
              {product.mrp > product.sellingPrice ? (
                <span className="text-muted text-xs line-through">
                  {formatPrice(product.mrp)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-xs font-medium text-[#7c5a1c]">
              Price pending approval
            </span>
          )}
          {discount > 0 ? (
            <span className="text-xs font-medium text-[#7c5a1c]">
              Save {formatPrice(product.mrp - product.sellingPrice)} ({discount}
              % off)
            </span>
          ) : null}
        </div>
        {product.availableForSale === false ? (
          <p className="text-muted mt-1 text-xs">
            Unavailable —{" "}
            {product.publicationStatus?.replaceAll("_", " ") ??
              "pending product approval"}
          </p>
        ) : null}
        {product.cartEnabled ? (
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            sku={product.sku}
            stock={product.stock}
            variants={product.variants}
            price={product.sellingPrice}
            mrp={product.mrp}
            priceApproved={product.priceApproved}
            availableForSale={product.availableForSale}
          />
        ) : null}
      </div>
    </article>
  );
}
