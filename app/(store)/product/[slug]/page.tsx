import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/service";
import { getPublicReviewSummary } from "@/lib/reviews/service";
import { isNextImageSourceConfigured } from "@/lib/images";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo/site-url";

type PageProps = { params: Promise<{ slug: string }> };

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    keywords: product.seoKeywords,
    robots: product.purchasable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: {
      canonical: `/product/${encodeURIComponent(product.slug)}`,
    },
    openGraph: {
      type: "website",
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
      images: product.images[0]?.url
        ? [
            {
              url: product.images[0].url,
              alt: product.images[0].alt || product.name,
            },
          ]
        : [{ url: product.thumbnail, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      images: [product.images[0]?.url || product.thumbnail],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product),
    getPublicReviewSummary(product.id),
  ]);
  const gallery =
    product.images.length > 0
      ? product.images
      : [{ url: product.thumbnail, alt: product.name }];
  const productUrl = absoluteUrl(
    `/product/${encodeURIComponent(product.slug)}`,
  );
  const productJsonLd = product.purchasable
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.seoDescription || product.shortDescription,
        sku: product.sku,
        category: product.category?.name,
        image: gallery.map(({ url }) => absoluteUrl(url)),
        brand: { "@type": "Brand", name: "Dr. Golechas" },
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "INR",
          price: product.price.toFixed(2),
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        ...(product.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.rating.toFixed(1),
                reviewCount: product.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;
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
        name: product.category?.name ?? "Shop",
        item: absoluteUrl(
          `/shop/${encodeURIComponent(product.category?.slug ?? "")}`,
        ),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      {productJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(productJsonLd),
          }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />
      <Container className="py-8 sm:py-12">
        <Link
          href={`/shop/${encodeURIComponent(product.category?.slug ?? "")}`}
          className="text-teal inline-flex min-h-10 items-center gap-2 text-sm font-medium hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          {product.category?.name ?? "Shop"}
        </Link>
        <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="bg-cream relative aspect-square overflow-hidden rounded-sm">
              <Image
                src={gallery[0].url}
                alt={gallery[0].alt || product.name}
                fill
                unoptimized={!isNextImageSourceConfigured(gallery[0].url)}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.slice(1, 5).map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="bg-cream relative aspect-square overflow-hidden rounded-sm"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name}, image ${index + 2}`}
                      fill
                      unoptimized={!isNextImageSourceConfigured(image.url)}
                      sizes="(max-width: 640px) 22vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="py-1 lg:py-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#8c6a2d] uppercase">
              {product.subcategory?.name ?? product.category?.name}
            </p>
            <h1 className="font-display text-teal mt-3 text-4xl leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="text-muted mt-3 text-sm leading-6">
              {product.shortDescription}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm">
              {product.reviewCount > 0 ? (
                <>
                  <Star
                    aria-hidden="true"
                    className="fill-gold text-gold"
                    size={16}
                  />
                  <span className="text-ink font-semibold">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-muted">
                    ({product.reviewCount} reviews)
                  </span>
                </>
              ) : (
                <span className="text-muted">No reviews yet</span>
              )}
            </div>

            {product.purchasable ? (
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-teal text-2xl font-semibold">
                  {formatPrice(product.price)}
                </span>
                {product.mrp > product.price ? (
                  <>
                    <span className="text-muted text-sm line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-medium text-[#7c5a1c]">
                      {product.discountPercentage}% off
                    </span>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="border-line mt-6 rounded border bg-[#fbfaf5] p-4">
                <p className="text-sm font-semibold text-[#7c5a1c]">
                  Unavailable — {product.publicationStatus.replaceAll("_", " ")}
                </p>
                <p className="text-muted mt-1 text-xs">
                  Product details, pricing and applicable regulatory information
                  must be verified before this item can be purchased.
                </p>
              </div>
            )}
            <p
              className={`mt-3 text-sm font-medium ${product.stock > 0 ? "text-[#35664b]" : "text-muted"}`}
            >
              {product.stock > 0
                ? `${product.stock} in stock`
                : "Currently unavailable"}
            </p>
            <p className="text-muted mt-2 text-xs">SKU: {product.sku}</p>
            <div className="mt-6 max-w-sm">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                sku={product.sku}
                stock={product.stock}
                variants={product.variants}
                price={product.price}
                mrp={product.mrp}
                priceApproved={product.priceApproved}
                availableForSale={product.purchasable}
                showBuyNow
              />
            </div>

            <div className="border-line mt-7 border-t pt-6">
              <h2 className="font-display text-teal text-2xl">Description</h2>
              <p className="text-ink/80 mt-3 text-sm leading-7 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.ingredients.length > 0 ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">Ingredients</h2>
                <ul className="text-ink/80 mt-3 list-inside list-disc space-y-1 text-sm leading-6">
                  {product.ingredients.map((ingredient) => (
                    <li key={ingredient}>{ingredient}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.benefits.length > 0 ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">Benefits</h2>
                <ul className="text-ink/80 mt-3 list-inside list-disc space-y-1 text-sm leading-6">
                  {product.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.howToUse ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">How to use</h2>
                <p className="text-ink/80 mt-3 text-sm leading-7 whitespace-pre-line">
                  {product.howToUse}
                </p>
              </section>
            ) : null}

            {product.storageInstructions ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">Storage</h2>
                <p className="text-ink/80 mt-3 text-sm leading-7">
                  {product.storageInstructions}
                </p>
              </section>
            ) : null}

            {product.safetyInformation ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">
                  Safety information
                </h2>
                <p className="text-ink/80 mt-3 text-sm leading-7">
                  {product.safetyInformation}
                </p>
              </section>
            ) : null}

            {product.regulatoryClassification ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">
                  Regulatory information
                </h2>
                <p className="text-ink/80 mt-3 text-sm leading-7">
                  {product.regulatoryClassification}
                </p>
              </section>
            ) : null}

            {!product.productDetailsVerified ? (
              <p className="mt-5 rounded bg-[#fff8e7] p-3 text-xs leading-5 text-[#6d5528]">
                Draft product information — verify the final formulation,
                directions and applicable licence before publication.
              </p>
            ) : null}

            {Object.keys(product.specifications).length > 0 ? (
              <section className="border-line mt-6 border-t pt-5">
                <h2 className="font-display text-teal text-xl">
                  Specifications
                </h2>
                <dl className="divide-line mt-3 divide-y text-sm">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 py-2.5">
                        <dt className="text-ink font-medium">{key}</dt>
                        <dd className="text-muted">{value}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      </Container>

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        summary={reviews}
      />

      {relatedProducts.length > 0 ? (
        <section className="border-line border-t bg-[#fbfaf5] py-14 sm:py-18">
          <Container>
            <SectionHeading
              eyebrow="Continue browsing"
              title="Related products"
              description="More from this part of the collection."
            />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={{
                    id: related.id,
                    name: related.name,
                    sku: related.sku,
                    category: related.category?.name ?? "Collection",
                    image: related.thumbnail,
                    imageAlt: related.images[0]?.alt || related.name,
                    rating: related.rating,
                    reviewCount: related.reviewCount,
                    mrp: related.mrp,
                    sellingPrice: related.price,
                    stock: related.stock,
                    priceApproved: related.priceApproved,
                    availableForSale: related.purchasable,
                    publicationStatus: related.publicationStatus,
                    cartEnabled: related.purchasable,
                    variants: related.variants,
                    badge: related.newArrival ? "New" : undefined,
                  }}
                  detailHref={`/product/${encodeURIComponent(related.slug)}`}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
