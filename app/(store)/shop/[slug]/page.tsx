import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/product/catalog-listing";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { findCategoryByKey } from "@/lib/categories/service";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo/site-url";
import { listProducts } from "@/lib/products/service";
import {
  parseProductFilters,
  searchParamsFromRecord,
} from "@/lib/products/validation";
import { getAllStoreCategories } from "@/lib/store-categories";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await findCategoryByKey(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description,
    alternates: {
      canonical: `/shop/${encodeURIComponent(category.slug)}`,
    },
    openGraph: {
      type: "website",
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description,
      url: absoluteUrl(`/shop/${encodeURIComponent(category.slug)}`),
      ...(category.image ? { images: [category.image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description,
      ...(category.image ? { images: [category.image] } : {}),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const category = await findCategoryByKey(slug);
  if (!category) notFound();

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
              href={`/shop/${encodeURIComponent(slug)}`}
              className="bg-teal inline-flex min-h-11 items-center rounded-sm px-5 text-sm font-semibold text-white hover:bg-[var(--color-botanical-charcoal)]"
            >
              Clear filters
            </Link>
          }
        />
      </Container>
    );
  }

  const filters = { ...parsed.data, category: category.slug };
  const [categories, result] = await Promise.all([
    getAllStoreCategories(),
    listProducts(filters),
  ]);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: absoluteUrl("/shop"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: absoluteUrl(`/shop/${encodeURIComponent(category.slug)}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />
      <CatalogListing
        title={category.name}
        description={category.description}
        action={`/shop/${encodeURIComponent(category.slug)}`}
        products={result.products}
        pagination={result.pagination}
        categories={categories}
        filters={filters}
        searchParams={rawSearchParams}
        categoryLocked
      />
    </>
  );
}
