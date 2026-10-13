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
import { getStoreCategories } from "@/lib/store-categories";
import { getHomepageContent } from "@/lib/store/homepage-content";
import { getPublicStoreIdentity } from "@/lib/store/public-settings";
import { isNextImageSourceConfigured } from "@/lib/images";
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
  const [categories, content, identity] = await Promise.all([
    getStoreCategories(),
    getHomepageContent(),
    getPublicStoreIdentity(),
  ]);

  return (
    <>
      <section className="bg-cream overflow-hidden">
        <Container className="grid min-h-[580px] items-center gap-10 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-20">
          <div className="relative z-10 max-w-xl animate-[fade-up_700ms_ease-out_both]">
            <p className="mb-5 text-xs font-semibold tracking-[0.19em] text-[#8c6a2d] uppercase">
              Herbal wellness, naturally
            </p>
            <h1 className="font-display text-teal text-5xl leading-[1.02] sm:text-6xl lg:text-[72px]">
              Nature&apos;s Goodness. Tradition&apos;s Wisdom.
            </h1>
            {identity.tagline ? (
              <p className="text-teal/70 mt-5 text-xs font-semibold tracking-[0.2em] uppercase">
                {identity.tagline}
              </p>
            ) : null}
            <p className="text-ink/75 mt-5 max-w-md text-base leading-7 sm:text-lg sm:leading-8">
              Discover thoughtfully crafted herbal wellness, traditional
              Ayurvedic preparations, natural foods and botanical personal care
              from Dr. Golecha&apos;s Herbal Farm.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-teal inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0c4b5b]"
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
          </div>
          <div className="relative mx-auto aspect-[1.2/1] w-full max-w-2xl overflow-hidden rounded-sm bg-[#d8ddc8] lg:aspect-[1.18/1]">
            <Image
              src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=90"
              alt="Natural herbal wellness ingredients and traditional products"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="from-teal/35 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
            <div className="border-gold absolute bottom-5 left-5 max-w-[280px] border-l-2 pl-4 text-white sm:bottom-7 sm:left-7">
              <p className="text-xs tracking-[0.16em] text-white/80 uppercase">
                Rooted in tradition
              </p>
              <p className="font-display mt-1 text-2xl">
                Thoughtful wellness for everyday life.
              </p>
            </div>
            <span className="bg-paper/80 text-teal absolute top-5 right-5 hidden rounded-full border border-white/60 px-4 py-2 text-xs font-medium backdrop-blur-sm sm:block">
              From farm to home
            </span>
          </div>
        </Container>
      </section>

      <section id="categories" className="scroll-mt-8 py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            eyebrow="Shop by category"
            title="Thoughtful care in every category"
            description="Explore farm essentials, traditional wellness, and herbal personal care for everyday rituals."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className={`group bg-teal relative isolate flex min-h-[280px] items-end overflow-hidden rounded-sm ${index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={`${category.name} category`}
                    fill
                    unoptimized={!isNextImageSourceConfigured(category.image)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="-z-20 object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : null}
                <div className="from-teal/85 via-teal/15 absolute inset-0 -z-10 bg-gradient-to-t to-transparent" />
                <div className="flex w-full items-end justify-between gap-4 p-5 sm:p-6">
                  <div className="text-white">
                    <h3 className="font-display text-2xl sm:text-3xl">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      {category.description}
                    </p>
                  </div>
                  <span className="group-hover:text-teal grid size-10 shrink-0 place-items-center rounded-full border border-white/50 text-white transition-colors group-hover:bg-white">
                    <ArrowRight aria-hidden="true" size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[#fbfaf5] py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="A few favourites"
              title="Made for your everyday"
              description="A closer look at some thoughtful picks from our collection."
            />
            <Link
              href="/shop"
              className="text-teal inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold hover:text-[#0c4b5b] sm:mb-1 sm:self-auto"
            >
              View all products <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:mt-10 lg:grid-cols-4">
            {content.featured.map(({ product, href }) => (
              <ProductCard
                key={product.id}
                product={product}
                detailHref={href}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Just arrived"
              title="Meet what’s new"
              description="Fresh additions to make your everyday feel a little more considered."
            />
            <Link
              href="/new-arrivals"
              className="text-teal inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold hover:text-[#0c4b5b] sm:mb-1 sm:self-auto"
            >
              Explore new arrivals <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:mt-10 lg:grid-cols-4">
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

      {content.reviews.length || content.testimonials.length ? (
        <section className="bg-[#fbfaf5] py-16 sm:py-20">
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
                  className="rounded border border-[#e0e6e3] bg-white p-5"
                >
                  <div
                    className="flex gap-1 text-[#c7a65b]"
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
                            : "text-[#d9dfdc]"
                        }
                      />
                    ))}
                  </div>
                  <h3 className="mt-3 font-semibold text-[#18343a]">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#55696b]">
                    {review.comment}
                  </p>
                  <p className="mt-4 text-xs text-[#68787a]">
                    {review.reviewer} · {review.productName}
                    {review.verifiedPurchase ? " · Verified purchase" : ""}
                  </p>
                </article>
              ))}
              {content.testimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="rounded border border-[#e0e6e3] bg-white p-5"
                >
                  <p className="font-display text-lg leading-7 text-[#315054]">
                    “{testimonial.quote}”
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[#18343a]">
                    {testimonial.authorName}
                  </p>
                  {testimonial.attribution ? (
                    <p className="mt-1 text-xs text-[#68787a]">
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
                  className="text-sm font-semibold text-[#0b6472] hover:underline"
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
          <Container className="flex flex-col items-start justify-between gap-5 rounded-lg bg-[#083847] p-6 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#e0c27d] uppercase">
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
