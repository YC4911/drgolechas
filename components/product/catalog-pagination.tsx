import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogPaginationProps = {
  action: string;
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
};

function pageHref(action: string, searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  params.set("page", page.toString());
  return `${action}?${params.toString()}`;
}

export function CatalogPagination({
  action,
  currentPage,
  totalPages,
  searchParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Product pages"
      className="border-line mt-10 flex items-center justify-center gap-5 border-t pt-6"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(action, searchParams, currentPage - 1)}
          rel="prev"
          className="text-teal text-sm font-semibold hover:underline"
        >
          Previous
        </Link>
      ) : (
        <span className="text-muted text-sm">Previous</span>
      )}
      <span aria-current="page" className="text-muted text-sm">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={pageHref(action, searchParams, currentPage + 1)}
          rel="next"
          className="text-teal text-sm font-semibold hover:underline"
        >
          Next
        </Link>
      ) : (
        <span className="text-muted text-sm">Next</span>
      )}
    </nav>
  );
}
