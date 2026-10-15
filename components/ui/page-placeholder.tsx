import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <Container className="flex min-h-[52vh] items-center py-16 sm:py-20">
      <div className="max-w-2xl">
        <p className="mb-4 text-xs font-semibold tracking-[0.17em] text-[var(--color-herbal-gold)] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-teal text-4xl leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="text-muted mt-4 max-w-xl text-base leading-7">
          {description}
        </p>
        <Link
          href="/shop"
          className="bg-teal mt-7 inline-flex min-h-11 items-center gap-2 rounded-sm px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-botanical-charcoal)]"
        >
          Explore the store <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </Container>
  );
}
