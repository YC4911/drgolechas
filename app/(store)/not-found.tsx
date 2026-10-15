import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-lg rounded border border-[var(--color-natural-beige)] bg-[var(--color-warm-ivory)] p-8 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-herbal-gold)] uppercase">
          404
        </p>
        <h1 className="font-display mt-4 text-4xl text-[var(--color-botanical-charcoal)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-botanical-charcoal)]">
          The page you are looking for may have moved, or it may not be
          available yet.
        </p>
        <Link
          href="/"
          className="bg-teal mt-6 inline-flex min-h-11 items-center justify-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)]"
        >
          Return home
        </Link>
      </div>
    </Container>
  );
}
