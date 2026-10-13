import { Container } from "@/components/ui/container";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ShopLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <Container aria-hidden="true" className="py-12 sm:py-16 lg:py-20">
        <LoadingSkeleton className="h-10 w-64" />
        <LoadingSkeleton className="mt-4 h-5 w-96 max-w-full" />
        <div className="border-line mt-8 grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <LoadingSkeleton key={index} className="h-11" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index}>
              <LoadingSkeleton className="aspect-[4/4.6]" />
              <LoadingSkeleton className="mt-3 h-4 w-2/3" />
              <LoadingSkeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
