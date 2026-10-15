"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Container } from "@/components/ui/container";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { isNextImageSourceConfigured } from "@/lib/images";
import type { StoreCategory } from "@/types/category";
import type { getPublicStoreIdentity } from "@/lib/store/public-settings";

type StoreIdentity = Awaited<ReturnType<typeof getPublicStoreIdentity>>;

type MainCategory = {
  name: string;
  slug: string;
  legacySlugs: string[];
  description: string;
  image: string;
  imageAlt: string;
};

type NavigationLink = {
  label: string;
  href: string;
};

type NavigationItem =
  | { type: "link"; label: string; href: string }
  | { type: "category"; label: string }
  | {
      type: "dropdown";
      id: string;
      label: string;
      links: NavigationLink[];
    };

const mainCategories: MainCategory[] = [
  {
    name: "Farm Essentials",
    slug: "farm-essentials",
    legacySlugs: ["farm-essential"],
    description:
      "Natural pantry staples and thoughtful essentials inspired by the farm.",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Fresh green herbs and plants in a sunlit garden",
  },
  {
    name: "Ayurvedic Wellness",
    slug: "ayurvedic-wellness",
    legacySlugs: ["wellness"],
    description:
      "Traditional wellness preparations for considered everyday rituals.",
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Herbal wellness preparations in warm natural light",
  },
  {
    name: "Herbal Personal Care",
    slug: "herbal-personal-care",
    legacySlugs: ["personal-care"],
    description: "Botanical care for hair, skin, and everyday self-care.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
    imageAlt: "Botanical personal-care products with green leaves",
  },
];

const navigation: NavigationItem[] = [
  { type: "link", label: "Home", href: "/" },
  { type: "link", label: "Shop All", href: "/shop" },
  { type: "category", label: "Category" },
  {
    type: "dropdown",
    id: "about",
    label: "About",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Our quality promise", href: "/quality" },
      { label: "Membership & rewards", href: "/membership" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    type: "dropdown",
    id: "support",
    label: "Support",
    links: [
      { label: "Frequently asked questions", href: "/faq" },
      { label: "Shipping policy", href: "/shipping-policy" },
      { label: "Returns & replacements", href: "/returns" },
      { label: "Order tracking", href: "/order-tracking" },
    ],
  },
  {
    type: "dropdown",
    id: "policies",
    label: "Policies",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
    ],
  },
];

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
  categories: StoreCategory[];
  identity: StoreIdentity;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileOpenMenu, setMobileOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const categoryCards = mainCategories.map((mainCategory) => {
    const category = categories.find(
      (item) =>
        item.slug === mainCategory.slug ||
        mainCategory.legacySlugs.includes(item.slug) ||
        item.name.trim().toLowerCase() === mainCategory.name.toLowerCase(),
    );

    return {
      ...mainCategory,
      href: `/shop/${encodeURIComponent(category?.slug ?? mainCategory.slug)}`,
      image: category?.image || mainCategory.image,
    };
  });

  return (
    <>
      <AnnouncementBar />
      <header
        className="border-line bg-paper relative z-20 border-b"
        onPointerLeave={() => {
          setActivePreview(null);
          setActiveDropdown(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setActivePreview(null);
            setActiveDropdown(null);
            setMobileMenuOpen(false);
            setMobileCategoriesOpen(false);
            setMobileOpenMenu(null);
            setSearchOpen(false);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setActivePreview(null);
            setActiveDropdown(null);
          }
        }}
      >
        <div className="border-line relative flex h-[88px] items-center justify-center sm:h-[100px] lg:border-b">
          <div className="absolute left-4 lg:hidden">
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
          </div>

          <form
            action="/shop"
            role="search"
            className="border-line bg-paper absolute left-4 hidden h-10 w-44 items-center border px-2 lg:flex xl:w-52"
          >
            <label className="sr-only" htmlFor="desktop-site-search">
              Search products
            </label>
            <input
              id="desktop-site-search"
              name="q"
              type="search"
              placeholder="Search products"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[var(--color-botanical-charcoal)] outline-none placeholder:text-[var(--color-muted-sage)]"
            />
            <Search
              aria-hidden="true"
              size={17}
              className="shrink-0 text-[var(--color-muted-sage)]"
            />
          </form>

          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label={`${identity.storeName} home`}
          >
            <Image
              src={identity.logo}
              alt={identity.storeName}
              width={160}
              height={128}
              priority
              unoptimized={!isNextImageSourceConfigured(identity.logo)}
              className="h-[72px] w-[90px] object-contain sm:h-[84px] sm:w-[105px] lg:h-[92px] lg:w-[115px]"
            />
          </Link>

          <div className="absolute right-3 flex shrink-0 items-center gap-0.5 sm:right-5">
            <div className="relative lg:hidden">
              <button
                type="button"
                aria-label={searchOpen ? "Close search" : "Search products"}
                aria-expanded={searchOpen}
                aria-controls="store-search"
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setMobileMenuOpen(false);
                }}
                className="text-teal hover:bg-cream grid size-10 place-items-center rounded-sm transition-colors"
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
                className="border-line bg-paper absolute top-[calc(100%+12px)] right-0 z-30 flex w-[min(88vw,22rem)] border p-2 shadow-lg"
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
                <Search
                  aria-hidden="true"
                  size={17}
                  className="shrink-0 self-center text-[var(--color-muted-sage)]"
                />
              </form>
            </div>
            <IconLink href="/account" label="Your account">
              <UserRound aria-hidden="true" size={19} />
            </IconLink>
            <div className="hidden lg:block">
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
            </div>
            <CartDrawer />
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="relative hidden min-h-12 items-center justify-center gap-5 px-4 pb-2 lg:flex xl:gap-7"
        >
          {navigation.map((item) => {
            if (item.type === "link") {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onPointerEnter={() => {
                    setActivePreview(null);
                    setActiveDropdown(null);
                  }}
                  onFocus={() => {
                    setActivePreview(null);
                    setActiveDropdown(null);
                  }}
                  className="text-ink hover:text-teal relative py-2 text-sm font-medium whitespace-nowrap transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-[var(--color-herbal-gold)] after:transition-transform hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              );
            }

            if (item.type === "category") {
              const isActive = activePreview !== null;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  aria-controls="category-preview"
                  onPointerEnter={() => {
                    setActiveDropdown(null);
                    setActivePreview("category");
                  }}
                  onFocus={() => {
                    setActiveDropdown(null);
                    setActivePreview("category");
                  }}
                  onClick={() => {
                    setActiveDropdown(null);
                    setActivePreview("category");
                  }}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:bg-[var(--color-herbal-gold)] after:transition-transform ${
                    isActive
                      ? "text-teal after:scale-x-100"
                      : "text-ink hover:text-teal after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            }

            const isActive = activeDropdown === item.id;
            const panelId = `desktop-navigation-${item.id}`;

            return (
              <div
                key={item.id}
                className="relative"
                onPointerEnter={() => {
                  setActivePreview(null);
                  setActiveDropdown(item.id);
                }}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  onFocus={() => {
                    setActivePreview(null);
                    setActiveDropdown(item.id);
                  }}
                  onClick={() =>
                    setActiveDropdown((openMenu) =>
                      openMenu === item.id ? null : item.id,
                    )
                  }
                  className={`relative py-2 text-sm font-medium whitespace-nowrap transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:bg-[var(--color-herbal-gold)] after:transition-transform ${
                    isActive
                      ? "text-teal after:scale-x-100"
                      : "text-ink hover:text-teal after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {item.label}
                    <ChevronDown
                      aria-hidden="true"
                      size={14}
                      className={`transition-transform ${isActive ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                <div
                  id={panelId}
                  aria-label={`${item.label} links`}
                  aria-hidden={!isActive}
                  inert={!isActive}
                  data-open={isActive}
                  className="border-line bg-paper absolute top-full left-1/2 z-40 min-w-56 -translate-x-1/2 border p-2 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out data-[open=false]:invisible data-[open=false]:-translate-y-1 data-[open=false]:opacity-0 data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100 motion-reduce:transition-none"
                >
                  {item.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      tabIndex={isActive ? undefined : -1}
                      onFocus={() => setActiveDropdown(item.id)}
                      onPointerEnter={() => setActiveDropdown(item.id)}
                      className="text-ink hover:bg-cream hover:text-teal block px-3 py-2.5 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          hidden={!mobileMenuOpen}
          className="border-line bg-paper absolute top-full right-0 left-0 z-30 border-t p-3 shadow-lg lg:hidden"
        >
          {navigation.map((item) => {
            if (item.type === "link") {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-line text-ink hover:text-teal block border-b px-3 py-3 text-sm last:border-0"
                >
                  {item.label}
                </Link>
              );
            }

            if (item.type === "category") {
              return (
                <div key={item.label} className="border-line border-b">
                  <button
                    type="button"
                    aria-expanded={mobileCategoriesOpen}
                    aria-controls="mobile-category-links"
                    onClick={() => {
                      setMobileOpenMenu(null);
                      setMobileCategoriesOpen((isOpen) => !isOpen);
                    }}
                    className="text-ink hover:text-teal flex w-full items-center justify-between px-3 py-3 text-left text-sm"
                  >
                    Category
                    <ChevronDown
                      aria-hidden="true"
                      size={16}
                      className={`transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {mobileCategoriesOpen ? (
                    <div id="mobile-category-links" className="pb-2 pl-4">
                      {categoryCards.map((category) => (
                        <Link
                          key={category.slug}
                          href={category.href}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileCategoriesOpen(false);
                          }}
                          className="text-muted hover:text-teal block px-3 py-2 text-sm"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            const isOpen = mobileOpenMenu === item.id;
            const panelId = `mobile-navigation-${item.id}`;

            return (
              <div key={item.id} className="border-line border-b">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    setMobileCategoriesOpen(false);
                    setMobileOpenMenu((openMenu) =>
                      openMenu === item.id ? null : item.id,
                    );
                  }}
                  className="text-ink hover:text-teal flex w-full items-center justify-between px-3 py-3 text-left text-sm"
                >
                  {item.label}
                  <ChevronDown
                    aria-hidden="true"
                    size={16}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <div id={panelId} className="pb-2 pl-4">
                    {item.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileOpenMenu(null);
                        }}
                        className="text-muted hover:text-teal block px-3 py-2 text-sm"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="border-line text-ink hover:text-teal block border-b px-3 py-3 text-sm last:border-0"
          >
            Wishlist
          </Link>
        </nav>

        <div
          id="category-preview"
          role="region"
          aria-label="Main product categories"
          aria-hidden={activePreview === null}
          inert={activePreview === null}
          data-open={activePreview !== null}
          className="border-line bg-paper absolute top-full right-0 left-0 z-20 border-t shadow-[0_18px_36px_-24px_rgba(8,56,71,0.5)] transition-[opacity,transform,visibility] duration-200 ease-out data-[open=false]:invisible data-[open=false]:-translate-y-2 data-[open=false]:opacity-0 data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100 motion-reduce:transition-none"
        >
          <Container className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-3 sm:gap-4 sm:py-5">
            {categoryCards.map((category) => (
              <Link
                key={category.slug}
                href={category.href}
                tabIndex={activePreview === null ? -1 : undefined}
                onPointerEnter={() => setActivePreview(category.slug)}
                className={`group flex min-h-24 items-center gap-4 rounded-sm border p-3 transition-colors duration-200 sm:min-h-36 sm:flex-col sm:items-stretch sm:gap-3 sm:p-3 ${
                  activePreview === category.slug
                    ? "border-[var(--color-herbal-gold)] bg-[var(--color-warm-ivory)]"
                    : "border-line bg-white hover:border-[var(--color-muted-sage)] hover:bg-[var(--color-warm-ivory)]"
                }`}
              >
                <div className="bg-cream relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-sm sm:aspect-[2/1] sm:w-full">
                  <Image
                    src={category.image}
                    alt={category.imageAlt}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 1024px) 30vw, 320px"
                    unoptimized={!isNextImageSourceConfigured(category.image)}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-lg leading-tight text-[var(--color-forest-olive)] sm:text-xl">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-forest-olive)] sm:text-sm">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </Container>
        </div>
      </header>
    </>
  );
}
