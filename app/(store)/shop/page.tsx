import Link from "next/link";
import { CatalogListing } from "@/components/product/catalog-listing";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { listProducts } from "@/lib/products/service";
import {
  parseProductFilters,
  searchParamsFromRecord,
} from "@/lib/products/validation";
import { getAllStoreCategories } from "@/lib/store-categories";
import { createPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPageMetadata(
  "Shop",
  "Browse the Dr. Golechas collection of thoughtful everyday essentials.",
  "/shop",
);

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: PageProps) {
  const rawSearchParams = await searchParams;
  const parsed = parseProductFilters(searchParamsFromRecord(rawSearchParams));

  if (!parsed.success) {
    return (
      <Container className="py-12 sm:py-16">
        <EmptyState
          title="Check your search filters."
          description={
            parsed.error.issues[0]?.message ??
            "One or more filters are invalid."
          }
          action={
            <Link
              href="/shop"
              className="bg-teal inline-flex min-h-11 items-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b]"
            >
              Clear filters
            </Link>
          }
        />
      </Container>
    );
  }

  const [categories, result] = await Promise.all([
    getAllStoreCategories(),
    listProducts(parsed.data),
  ]);

  return (
    <CatalogListing
      title="Shop all"
      description="Explore farm essentials, wellness, and personal care."
      action="/shop"
      products={result.products}
      pagination={result.pagination}
      categories={categories}
      filters={parsed.data}
      searchParams={rawSearchParams}
    />
  );
}
