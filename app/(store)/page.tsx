import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Leaf,
  PackageCheck,
  Sparkles,
  HeartHandshake,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomepageContent } from "@/lib/store/homepage-content";
import { getPublicStoreIdentity } from "@/lib/store/public-settings";
import { absoluteUrl } from "@/lib/seo/site-url";

export const metadata: Metadata = {
  title: "Herbal wellness, farm essentials and personal care",
  description:
    "Discover thoughtfully selected farm essentials, wellness, and personal care from Dr. Golechas.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Dr. Golechas | Thoughtful care, rooted in nature",
    description:
      "Discover thoughtfully selected farm essentials, wellness, and personal care from Dr. Golechas.",
    url: absoluteUrl("/"),
  },
};

const values = [
  {
    title: "Thoughtfully selected ingredients",
    detail: "Carefully chosen ingredients for routines rooted in nature.",
    icon: PackageCheck,
  },
  {
    title: "Clear product information",
    detail:
      "Transparent descriptions, practical guidance, and honest product detail.",
    icon: Sparkles,
  },
  {
    title: "Traditional inspiration",
    detail: "Classical formulations and everyday rituals informed by heritage.",
    icon: Leaf,
  },
  {
    title: "Customer-focused service",
    detail:
      "Support that feels personal, helpful, and respectful of your routine.",
    icon: HeartHandshake,
  },
];

export default async function HomePage() {
  const [content, identity] = await Promise.all([
    getHomepageContent(),
    getPublicStoreIdentity(),
  ]);

  return (
    <>
      <section className="bg-cream overflow-hidden">
        <h1 className="sr-only">Tradition You Trust, Wellness You Feel.</h1>
        <div className="relative mx-auto h-[clamp(240px,31.25vw,500px)] w-full max-w-[1600px] overflow-hidden">
          <Image
            src="/dr-golechas-hero.png"
            alt="Illustrated farmer holding a harvest crate among green fields, trees, and plants."
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <p
            aria-hidden="true"
            className="font-display text-teal absolute top-[8%] left-[6%] max-w-[88%] rounded-sm bg-[var(--color-cream)]/90 p-2 text-[clamp(1.5rem,6vw,2rem)] leading-tight backdrop-blur-sm sm:hidden"
          >
            Tradition You Trust,
            <br />
            Wellness You Feel.
          </p>
        </div>
        <Container className="flex flex-col items-center justify-between gap-5 py-6 sm:flex-row">
          {identity.tagline ? (
            <p className="text-teal/70 text-center text-xs font-semibold tracking-[0.2em] uppercase sm:text-left">
              {identity.tagline}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="bg-teal inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-botanical-charcoal)]"
            >
              Shop All Products <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              href="/shop/farm-essentials"
              className="border-teal/30 text-teal hover:border-teal inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border bg-white/50 px-6 text-sm font-semibold transition-colors hover:bg-white"
            >
              Explore Our Farm Essentials{" "}
              <Sparkles aria-hidden="true" size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <section
        className="bg-[var(--color-warm-ivory)] py-20 sm:py-24 lg:py-28"
        aria-label={
          content.featured.some(({ product }) => product.badge === "Top Pick")
            ? "Featured products"
            : "Shop products"
        }
      >
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow={
                content.featured.some(
                  ({ product }) => product.badge === "Top Pick",
                )
                  ? "Top picks"
                  : "Explore the collection"
              }
              title={
                content.featured.some(
                  ({ product }) => product.badge === "Top Pick",
                )
                  ? "Made for your everyday"
                  : "Shop our products"
              }
              description={
                content.featured.some(
                  ({ product }) => product.badge === "Top Pick",
                )
                  ? "A closer look at some thoughtful picks from our collection."
                  : "Browse products from our farm, wellness, and personal care collections."
              }
            />
            <Link
              href="/shop"
              className="text-teal inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold hover:text-[var(--color-botanical-charcoal)] sm:mb-1 sm:self-auto"
            >
              View all products <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          {content.featured.length ? (
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-12 lg:grid-cols-4 lg:gap-x-8">
              {content.featured.map(({ product, href }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  detailHref={href}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-[var(--color-forest-olive)]">
              Products are being added to the collection. Please check back
              soon.
            </p>
          )}
        </Container>
      </section>

      {content.newArrivals.length ? (
        <section className="py-20 sm:py-24 lg:py-28">
          <Container>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Just arrived"
                title="Meet what’s new"
                description="Fresh additions to make your everyday feel a little more considered."
              />
              <Link
                href="/new-arrivals"
                className="text-teal inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold hover:text-[var(--color-botanical-charcoal)] sm:mb-1 sm:self-auto"
              >
                Explore new arrivals <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-12 lg:grid-cols-4 lg:gap-x-8">
              {content.newArrivals.map(({ product, href }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  detailHref={href}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {content.reviews.length || content.testimonials.length ? (
        <section className="bg-[var(--color-warm-ivory)] py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="From our customers"
              title="Stories from the community"
              description="Reviews and testimonials shared by customers and approved for display."
              align="center"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {content.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded border border-[var(--color-natural-beige)] bg-white p-5"
                >
                  <div
                    className="flex gap-1 text-[var(--color-herbal-gold)]"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        aria-hidden="true"
                        size={14}
                        className={
                          index < review.rating
                            ? "fill-current"
                            : "text-[var(--color-natural-beige)]"
                        }
                      />
                    ))}
                  </div>
                  <h3 className="mt-3 font-semibold text-[var(--color-botanical-charcoal)]">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-botanical-charcoal)]">
                    {review.comment}
                  </p>
                  <p className="mt-4 text-xs text-[var(--color-forest-olive)]">
                    {review.reviewer} · {review.productName}
                    {review.verifiedPurchase ? " · Verified purchase" : ""}
                  </p>
                </article>
              ))}
              {content.testimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="rounded border border-[var(--color-natural-beige)] bg-white p-5"
                >
                  <p className="font-display text-lg leading-7 text-[var(--color-forest-olive)]">
                    “{testimonial.quote}”
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[var(--color-botanical-charcoal)]">
                    {testimonial.authorName}
                  </p>
                  {testimonial.attribution ? (
                    <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
                      {testimonial.attribution}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
            {content.reviews.length ? (
              <div className="mt-6 text-center">
                <Link
                  href="/shop"
                  className="text-sm font-semibold text-[var(--color-forest-olive)] hover:underline"
                >
                  Explore products and customer reviews{" "}
                  <ArrowRight className="ml-1 inline" size={15} />
                </Link>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      {identity.socialLinks.length ? (
        <section className="py-14 sm:py-18">
          <Container className="flex flex-col items-start justify-between gap-5 rounded-lg bg-[var(--color-forest-olive)] p-6 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-herbal-gold)] uppercase">
                Stay connected
              </p>
              <h2 className="font-display mt-2 text-2xl sm:text-3xl">
                Follow {identity.storeName}
              </h2>
              <p className="mt-2 text-sm text-white/75">
                Find us on your favourite channels.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {identity.socialLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center rounded border border-white/30 px-4 text-sm font-semibold hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-line bg-cream border-y py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Our philosophy"
            title="A little more care in every choice"
            description="Traditional preparation, careful sourcing, and transparent product information guide every recommendation."
            align="center"
          />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {values.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="text-center">
                <span className="border-gold/50 text-teal mx-auto grid size-12 place-items-center rounded-full border">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.6} />
                </span>
                <h3 className="font-display text-teal mt-4 text-xl">{title}</h3>
                <p className="text-muted mx-auto mt-2 max-w-xs text-sm leading-6">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
