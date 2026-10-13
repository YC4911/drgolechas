"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Container } from "@/components/ui/container";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { isNextImageSourceConfigured } from "@/lib/images";
import type { CategoryNavigationItem } from "@/types/category";
import type { getPublicStoreIdentity } from "@/lib/store/public-settings";

type StoreIdentity = Awaited<ReturnType<typeof getPublicStoreIdentity>>;

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="text-teal hover:bg-cream grid size-10 place-items-center rounded-sm transition-colors"
    >
      {children}
    </Link>
  );
}

export function Header({
  categories,
  identity,
}: {
  categories: CategoryNavigationItem[];
  identity: StoreIdentity;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigation = [
    { label: "Home", href: "/" },
    { label: "Shop All", href: "/shop" },
    ...categories.map((category) => ({
      label: category.name,
      href: `/shop/${encodeURIComponent(category.slug)}`,
    })),
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <AnnouncementBar />
      <header
        className="border-line bg-paper relative z-20 border-b"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMobileMenuOpen(false);
            setSearchOpen(false);
          }
        }}
      >
        <Container className="flex min-h-[76px] items-center justify-between gap-4">
          <div className="relative lg:hidden">
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setSearchOpen(false);
              }}
              className="text-teal hover:bg-cream grid size-10 place-items-center rounded-sm"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" size={21} />
              ) : (
                <Menu aria-hidden="true" size={21} />
              )}
            </button>
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              hidden={!mobileMenuOpen}
              className="border-line bg-paper absolute top-[calc(100%+12px)] left-0 z-30 w-[min(88vw,22rem)] border p-3 shadow-lg"
            >
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-line text-ink hover:text-teal block border-b px-3 py-3 text-sm last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/"
            className="text-teal flex shrink-0 items-center gap-2 text-center"
            aria-label={`${identity.storeName} home`}
          >
            {identity.logo ? (
              <Image
                src={identity.logo}
                alt=""
                width={44}
                height={44}
                unoptimized={!isNextImageSourceConfigured(identity.logo)}
                className="size-11 object-contain"
              />
            ) : null}
            <span>
              <span className="font-display block text-[22px] leading-none sm:text-2xl">
                {identity.storeName}
              </span>
              {identity.tagline ? (
                <span className="text-muted mt-1 hidden text-[9px] font-medium tracking-[0.12em] sm:block">
                  {identity.tagline}
                </span>
              ) : null}
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-7"
          >
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-ink hover:text-teal py-2 text-xs font-medium whitespace-nowrap transition-colors xl:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <div className="relative">
              <button
                type="button"
                aria-label={searchOpen ? "Close search" : "Search products"}
                aria-expanded={searchOpen}
                aria-controls="store-search"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setMobileMenuOpen(false);
                }}
                className="text-teal hover:bg-cream grid size-10 place-items-center rounded-sm"
              >
                {searchOpen ? (
                  <X aria-hidden="true" size={19} />
                ) : (
                  <Search aria-hidden="true" size={19} />
                )}
              </button>
              <form
                id="store-search"
                action="/shop"
                role="search"
                hidden={!searchOpen}
                className="border-line bg-paper absolute top-[calc(100%+12px)] right-0 z-30 w-[min(88vw,22rem)] border p-2 shadow-lg"
              >
                <label className="sr-only" htmlFor="site-search">
                  Search products
                </label>
                <input
                  id="site-search"
                  name="q"
                  type="search"
                  placeholder="Search the store"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="bg-teal rounded-sm px-3 text-sm text-white hover:bg-[#0c4b5b]"
                >
                  Search
                </button>
              </form>
            </div>
            <IconLink href="/account" label="Your account">
              <UserRound aria-hidden="true" size={19} />
            </IconLink>
            <IconLink href="/wishlist" label="Wishlist">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path d="M12 20.25s-7.5-4.35-9.75-8.18C.72 9.56 2.09 5.25 6.08 5.25c2.18 0 3.42 1.15 4.24 2.26.82-1.11 2.06-2.26 4.24-2.26 3.99 0 5.36 4.31 3.83 6.82C19.5 15.9 12 20.25 12 20.25Z" />
              </svg>
            </IconLink>
            <CartDrawer />
          </div>
        </Container>
      </header>
    </>
  );
}
