"use client";

import { Container } from "@/components/ui/container";

export default function ProductError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Container className="flex min-h-[45vh] items-center py-12">
      <div role="alert" className="max-w-xl">
        <h1 className="font-display text-teal text-3xl">
          Product details are unavailable.
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          We couldn’t load this product right now. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-teal mt-6 min-h-11 rounded-sm px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
        >
          Try again
        </button>
      </div>
    </Container>
  );
}
