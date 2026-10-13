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
      <div className="mx-auto max-w-xl rounded border border-[#e3e7e1] bg-[#f9f7f1] p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-white text-[#18343a] shadow-sm">
          <Heart
            aria-hidden="true"
            size={28}
            className="fill-[#c7a65b] text-[#c7a65b]"
          />
        </div>
        <h1 className="font-display mt-5 text-3xl text-[#18343a]">
          Your wishlist is empty
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#425554]">
          Save products you love and come back to them later. Browse the
          collection to start building your herbal essentials list.
        </p>
        <Link
          href="/shop"
          className="bg-teal mt-6 inline-flex min-h-11 items-center justify-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
        >
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
