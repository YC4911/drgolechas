import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-lg rounded border border-[#e3e7e1] bg-[#f9f7f1] p-8 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#8c6a2d] uppercase">404</p>
        <h1 className="mt-4 font-display text-4xl text-[#18343a]">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-[#425554]">
          The page you are looking for may have moved, or it may not be available yet.
        </p>
        <Link
          href="/"
          className="bg-teal mt-6 inline-flex min-h-11 items-center justify-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
        >
          Return home
        </Link>
      </div>
    </Container>
  );
}
