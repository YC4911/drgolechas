import { ProductCard } from "@/components/product/product-card";
import { CatalogControls } from "@/components/product/catalog-controls";
import { CatalogPagination } from "@/components/product/catalog-pagination";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductPageResult } from "@/lib/products/service";
import type { ProductFilters } from "@/lib/products/validation";
import type { StoreCategory } from "@/types/category";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogListingProps = {
  title: string;
  description: string;
  action: string;
  products: ProductPageResult["products"];
  pagination: ProductPageResult["pagination"];
  categories: StoreCategory[];
  filters: ProductFilters;
  searchParams: SearchParams;
  categoryLocked?: boolean;
};

export function CatalogListing({
  title,
  description,
  action,
  products,
  pagination,
  categories,
  filters,
  searchParams,
  categoryLocked = false,
}: CatalogListingProps) {
  const firstResult =
    pagination.totalProducts === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.pageSize + 1;
  const lastResult = Math.min(
    pagination.currentPage * pagination.pageSize,
    pagination.totalProducts,
  );

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <SectionHeading
        eyebrow="The collection"
        title={title}
        description={description}
        level="h1"
      />
      <CatalogControls
        action={action}
        categories={categories}
        filters={filters}
        categoryLocked={categoryLocked}
      />
      <div className="text-muted mt-6 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p>
          Showing {firstResult}-{lastResult} of {pagination.totalProducts}{" "}
          products
        </p>
        {pagination.totalProducts > 0 ? (
          <p>
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
        ) : null}
      </div>
      {products.length > 0 ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  category:
                    product.subcategory?.name ??
                    product.category?.name ??
                    "Collection",
                  image: product.thumbnail,
                  imageAlt: product.images[0]?.alt || product.name,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  mrp: product.mrp,
                  sellingPrice: product.price,
                  stock: product.stock,
                  priceApproved: product.priceApproved,
                  availableForSale: product.purchasable,
                  publicationStatus: product.publicationStatus,
                  cartEnabled: product.purchasable,
                  variants: product.variants,
                  badge: product.featured
                    ? "Featured"
                    : product.newArrival
                      ? "New"
                      : undefined,
                }}
                detailHref={`/product/${encodeURIComponent(product.slug)}`}
              />
            ))}
          </div>
          <CatalogPagination
            action={action}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            searchParams={searchParams}
          />
        </>
      ) : (
        <div className="border-line mt-5 border-y">
          <EmptyState
            title="No products match these filters."
            description="Try a different search or clear the filters to browse the full collection."
          />
        </div>
      )}
    </Container>
  );
}
