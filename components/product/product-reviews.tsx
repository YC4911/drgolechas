"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import type { ReviewSummary } from "@/lib/reviews/service";

export function ProductReviews({
  productId,
  productSlug,
  summary,
}: {
  productId: string;
  productSlug: string;
  summary: ReviewSummary;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    setLoginRequired(false);
    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(productId)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, title, comment }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (response.status === 401) {
        setLoginRequired(true);
        throw new Error("Sign in to submit a review.");
      }
      if (!response.ok)
        throw new Error(payload.error ?? "Unable to submit your review.");
      setTitle("");
      setComment("");
      setRating(5);
      setMessage(
        "Thank you. Your review is awaiting moderation before it appears here.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit your review.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="reviews"
      className="border-line border-t bg-[var(--color-warm-ivory)] py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-herbal-gold)] uppercase">
              Customer reviews
            </p>
            <h2 className="font-display mt-2 text-3xl text-[var(--color-forest-olive)]">
              What customers say
            </h2>
            <div className="mt-5 flex items-center gap-2">
              <Star
                aria-hidden="true"
                className="fill-[var(--color-herbal-gold)] text-[var(--color-herbal-gold)]"
                size={20}
              />
              <span className="text-xl font-semibold text-[var(--color-botanical-charcoal)]">
                {summary.reviewCount ? summary.averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-[var(--color-forest-olive)]">
                · {summary.reviewCount}{" "}
                {summary.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars] ?? 0;
                const percentage = summary.reviewCount
                  ? (count / summary.reviewCount) * 100
                  : 0;
                return (
                  <div
                    key={stars}
                    className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-xs text-[var(--color-forest-olive)]"
                  >
                    <span>{stars} star</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[var(--color-natural-beige)]">
                      <span
                        className="block h-full rounded-full bg-[var(--color-herbal-gold)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </span>
                    <span className="text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <form
              onSubmit={submitReview}
              className="mt-8 rounded border border-[var(--color-natural-beige)] bg-white p-4 sm:p-5"
            >
              <h3 className="font-display text-xl text-[var(--color-forest-olive)]">
                Write a review
              </h3>
              <p className="mt-1 text-xs leading-5 text-[var(--color-forest-olive)]">
                Reviews are checked by our team before publishing. Please share
                your experience with the product.
              </p>
              <label className="mt-4 block text-xs font-semibold text-[var(--color-botanical-charcoal)]">
                Your rating
                <select
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="mt-1.5 min-h-11 w-full rounded border border-[var(--color-natural-beige)] bg-white px-3 text-sm font-normal"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "star" : "stars"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold text-[var(--color-botanical-charcoal)]">
                Title
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded border border-[var(--color-natural-beige)] px-3 text-sm font-normal"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-[var(--color-botanical-charcoal)]">
                Comment
                <textarea
                  required
                  minLength={5}
                  maxLength={3000}
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="mt-1.5 w-full rounded border border-[var(--color-natural-beige)] p-3 text-sm font-normal"
                />
              </label>
              {error ? (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              {loginRequired ? (
                <Link
                  href={`/login?next=${encodeURIComponent(`/product/${productSlug}#reviews`)}`}
                  className="mt-2 inline-block text-sm font-semibold text-[var(--color-forest-olive)] underline"
                >
                  Sign in to continue
                </Link>
              ) : null}
              {message ? (
                <p role="status" className="mt-3 text-sm text-emerald-800">
                  {message}
                </p>
              ) : null}
              <button
                disabled={saving}
                className="mt-4 min-h-11 rounded bg-[var(--color-forest-olive)] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Submit review"}
              </button>
            </form>
          </div>
          <div className="space-y-4">
            {summary.reviews.length ? (
              summary.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded border border-[var(--color-natural-beige)] bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className="flex gap-0.5"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={14}
                          className={
                            index < review.rating
                              ? "fill-[var(--color-herbal-gold)] text-[var(--color-herbal-gold)]"
                              : "text-[var(--color-natural-beige)]"
                          }
                        />
                      ))}
                    </div>
                    <time
                      className="text-xs text-[var(--color-forest-olive)]"
                      dateTime={review.createdAt}
                    >
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : ""}
                    </time>
                  </div>
                  <h3 className="mt-3 font-semibold text-[var(--color-botanical-charcoal)]">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-botanical-charcoal)]">
                    {review.comment}
                  </p>
                  <p className="mt-3 text-xs text-[var(--color-forest-olive)]">
                    {review.reviewer}
                    {review.verifiedPurchase ? (
                      <span className="ml-2 font-semibold text-emerald-800">
                        Verified purchase
                      </span>
                    ) : null}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded border border-dashed border-[var(--color-natural-beige)] bg-white p-6 text-sm text-[var(--color-forest-olive)]">
                No approved reviews yet. You can be the first to share your
                experience.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
