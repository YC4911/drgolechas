import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <Container className="py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-xl rounded border border-[var(--color-natural-beige)] bg-[var(--color-warm-ivory)] p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-white text-[var(--color-botanical-charcoal)] shadow-sm">
          <Heart
            aria-hidden="true"
            size={28}
            className="fill-[var(--color-herbal-gold)] text-[var(--color-herbal-gold)]"
          />
        </div>
        <h1 className="font-display mt-5 text-3xl text-[var(--color-botanical-charcoal)]">
          Your wishlist is empty
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
          Save products you love and come back to them later. Browse the
          collection to start building your herbal essentials list.
        </p>
        <Link
          href="/shop"
          className="bg-teal mt-6 inline-flex min-h-11 items-center justify-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)]"
        >
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
