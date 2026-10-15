"use client";

import Link from "next/link";
import { ChevronDown, Filter, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StoreCategory } from "@/types/category";
import type { ProductFilters } from "@/lib/products/validation";

type CatalogControlsProps = {
  action: string;
  categories: StoreCategory[];
  filters: ProductFilters;
  categoryLocked?: boolean;
};

export function CatalogControls({
  action,
  categories,
  filters,
  categoryLocked = false,
}: CatalogControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const subcategories = categories.filter(
    (category) => category.parentCategoryId !== null,
  );

  return (
    <section className="mt-8" aria-label="Product filters">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant={isOpen ? "primary" : "secondary"}
          aria-expanded={isOpen}
          aria-controls="catalog-filter-panel"
          onClick={() => setIsOpen((open) => !open)}
        >
          <Filter aria-hidden="true" size={17} />
          Filters
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
        <p className="text-muted text-xs">
          {isOpen
            ? "Adjust your selections, then apply filters."
            : "Refine your collection"}
        </p>
      </div>

      <div
        id="catalog-filter-panel"
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-open={isOpen}
        className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out data-[open=true]:grid-rows-[1fr] data-[open=true]:opacity-100 motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <form
            action={action}
            method="get"
            className="border-line mt-4 grid gap-4 border-y bg-[var(--color-warm-ivory)] px-4 py-5 sm:grid-cols-2 sm:px-5 lg:grid-cols-4"
          >
            {categoryLocked && filters.category ? (
              <input type="hidden" name="category" value={filters.category} />
            ) : null}
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Search products
              <Input
                name="q"
                type="search"
                defaultValue={filters.q ?? ""}
                placeholder="Name, keyword or SKU"
              />
            </label>
            {!categoryLocked ? (
              <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
                Category
                <Select name="category" defaultValue={filters.category ?? ""}>
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Subcategory
              <Select
                name="subcategory"
                defaultValue={filters.subcategory ?? ""}
              >
                <option value="">All subcategories</option>
                {subcategories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="text-ink mb-1.5 text-xs font-medium">
                Price range
              </legend>
              <label className="sr-only" htmlFor="catalog-min-price">
                Minimum price
              </label>
              <Input
                id="catalog-min-price"
                name="minPrice"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Min ₹"
                defaultValue={filters.minPrice}
              />
              <label className="sr-only" htmlFor="catalog-max-price">
                Maximum price
              </label>
              <Input
                id="catalog-max-price"
                name="maxPrice"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Max ₹"
                defaultValue={filters.maxPrice}
              />
            </fieldset>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Minimum rating
              <Select
                name="rating"
                defaultValue={filters.rating?.toString() ?? ""}
              >
                <option value="">Any rating</option>
                <option value="4">4 stars and up</option>
                <option value="3">3 stars and up</option>
                <option value="2">2 stars and up</option>
                <option value="1">1 star and up</option>
              </Select>
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Availability
              <Select name="availability" defaultValue={filters.availability}>
                <option value="all">All products</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </Select>
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              New arrivals
              <Select
                name="newArrival"
                defaultValue={
                  filters.newArrival === undefined
                    ? ""
                    : String(filters.newArrival)
                }
              >
                <option value="">Any</option>
                <option value="true">New arrivals</option>
                <option value="false">Not new arrivals</option>
              </Select>
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Featured
              <Select
                name="featured"
                defaultValue={
                  filters.featured === undefined ? "" : String(filters.featured)
                }
              >
                <option value="">Any</option>
                <option value="true">Featured</option>
                <option value="false">Not featured</option>
              </Select>
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Tags
              <Input
                name="tags"
                defaultValue={filters.tags.join(", ")}
                placeholder="Separate with commas"
              />
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Sort by
              <Select name="sort" defaultValue={filters.sort}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Rating</option>
                <option value="featured">Featured</option>
              </Select>
            </label>
            <label className="text-ink flex flex-col gap-1.5 text-xs font-medium">
              Products per page
              <Select
                name="pageSize"
                defaultValue={filters.pageSize.toString()}
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </Select>
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
              <Button type="submit">Apply filters</Button>
              <Link
                href={action}
                className="text-teal inline-flex min-h-11 items-center px-2 text-sm font-medium hover:underline"
              >
                Clear filters
              </Link>
              <Button
                type="button"
                variant="quiet"
                className="ml-auto lg:hidden"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={16} />
                Close filters
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
