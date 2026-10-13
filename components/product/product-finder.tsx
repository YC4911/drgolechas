"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import {
  productFinderQuestions,
  shoppingGoals,
} from "@/services/recommendation/questions";
import type {
  FinderAnswers,
  FinderCategory,
  RecommendedProduct,
} from "@/services/recommendation/types";
import type { Product } from "@/types/product";

type FinderOptions = {
  categories: FinderCategory[];
  formats: string[];
  preferences: string[];
};

const budgets: { label: string; value: number | null }[] = [
  { label: "Any budget", value: null },
  { label: "Up to ₹500", value: 500 },
  { label: "Up to ₹1,000", value: 1000 },
  { label: "Up to ₹2,000", value: 2000 },
  { label: "Up to ₹5,000", value: 5000 },
];

const initialAnswers: FinderAnswers = {
  shoppingFor: "",
  category: null,
  productType: null,
  preferences: [],
  maximumPrice: null,
  inStockOnly: true,
};

function OptionButton({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded border px-4 py-3 text-left text-sm transition-colors ${
        selected
          ? "border-[#0d5968] bg-[#e9f2ef] font-semibold text-[#083847]"
          : "border-[#dfe6e3] bg-white text-[#31484b] hover:border-[#8ea9a2]"
      }`}
    >
      {children}
    </button>
  );
}

export function ProductFinder({ options }: { options: FinderOptions }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<FinderAnswers>(initialAnswers);
  const [results, setResults] = useState<RecommendedProduct[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function togglePreference(value: string) {
    setAnswers((current) => ({
      ...current,
      preferences: current.preferences.includes(value)
        ? current.preferences.filter((preference) => preference !== value)
        : [...current.preferences, value],
    }));
  }

  async function showRecommendations() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const payload = (await response.json()) as {
        data?: RecommendedProduct[];
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error ?? "Unable to find recommendations right now.",
        );
      }
      setResults(payload.data);
      setHasResults(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to find recommendations right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setAnswers(initialAnswers);
    setResults([]);
    setHasResults(false);
    setError("");
  }

  const question = productFinderQuestions[step];
  const progress = ((step + 1) / productFinderQuestions.length) * 100;

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-[#dfe6e3] bg-white shadow-[0_8px_32px_rgba(10,45,50,.06)]">
      {!hasResults ? (
        <>
          <div className="border-b border-[#e8ece9] px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between text-xs font-semibold text-[#68787a]">
              <span>
                Question {step + 1} of {productFinderQuestions.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0ed]">
              <div
                className="h-full rounded-full bg-[#0d5968] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="min-h-72 px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="font-display text-2xl text-[#083847] sm:text-3xl">
              {question.title}
            </h2>
            <p className="mt-2 text-sm text-[#68787a]">{question.hint}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.key === "shoppingFor"
                ? shoppingGoals.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={answers.shoppingFor === option.value}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          shoppingFor: option.value,
                        }))
                      }
                    >
                      {option.label}
                    </OptionButton>
                  ))
                : null}
              {question.key === "category" ? (
                <>
                  <OptionButton
                    selected={answers.category === null}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, category: null }))
                    }
                  >
                    All categories
                  </OptionButton>
                  {options.categories.map((category) => (
                    <OptionButton
                      key={category.slug}
                      selected={answers.category === category.slug}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          category: category.slug,
                        }))
                      }
                    >
                      {category.name}
                    </OptionButton>
                  ))}
                </>
              ) : null}
              {question.key === "productType" ? (
                <>
                  <OptionButton
                    selected={answers.productType === null}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        productType: null,
                      }))
                    }
                  >
                    Any format
                  </OptionButton>
                  {options.formats.map((format) => (
                    <OptionButton
                      key={format}
                      selected={answers.productType === format}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          productType: format,
                        }))
                      }
                    >
                      {format}
                    </OptionButton>
                  ))}
                </>
              ) : null}
              {question.key === "preferences" ? (
                <>
                  <OptionButton
                    selected={answers.preferences.length === 0}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, preferences: [] }))
                    }
                  >
                    No specific preference
                  </OptionButton>
                  {options.preferences.map((preference) => (
                    <OptionButton
                      key={preference}
                      selected={answers.preferences.includes(preference)}
                      onClick={() => togglePreference(preference)}
                    >
                      {preference}
                    </OptionButton>
                  ))}
                </>
              ) : null}
              {question.key === "maximumPrice"
                ? budgets.map((budget) => (
                    <OptionButton
                      key={String(budget.value)}
                      selected={answers.maximumPrice === budget.value}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          maximumPrice: budget.value,
                        }))
                      }
                    >
                      {budget.label}
                    </OptionButton>
                  ))
                : null}
              {question.key === "inStockOnly" ? (
                <>
                  <OptionButton
                    selected={answers.inStockOnly}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        inStockOnly: true,
                      }))
                    }
                  >
                    Yes, show in-stock products
                  </OptionButton>
                  <OptionButton
                    selected={!answers.inStockOnly}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        inStockOnly: false,
                      }))
                    }
                  >
                    No, include unavailable products
                  </OptionButton>
                </>
              ) : null}
            </div>
          </div>
          {error ? (
            <p
              role="alert"
              className="mx-5 mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-8"
            >
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between border-t border-[#e8ece9] px-5 py-4 sm:px-8">
            <button
              type="button"
              disabled={step === 0 || loading}
              onClick={() => setStep((current) => current - 1)}
              className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-sm font-semibold text-[#315054] disabled:invisible"
            >
              <ArrowLeft size={16} /> Back
            </button>
            {step < productFinderQuestions.length - 1 ? (
              <button
                type="button"
                disabled={step === 0 && !answers.shoppingFor}
                onClick={() => setStep((current) => current + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded bg-[#083847] px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => void showRecommendations()}
                className="inline-flex min-h-11 items-center gap-2 rounded bg-[#083847] px-5 text-sm font-semibold text-white hover:bg-[#0c4b5b] disabled:opacity-60"
              >
                {loading ? "Finding matches…" : "Show recommendations"}{" "}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#8c6a2d] uppercase">
                Your product matches
              </p>
              <h2 className="font-display mt-2 text-3xl text-[#083847]">
                A few good places to start
              </h2>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-10 items-center gap-2 rounded border border-[#dfe6e3] px-3 text-sm font-semibold text-[#315054]"
            >
              <RotateCcw size={15} /> Start over
            </button>
          </div>
          {results.length ? (
            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
              {results.map(({ product, reason }) => {
                const cardProduct: Product = {
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  category: product.category.name,
                  image: product.thumbnail,
                  imageAlt: product.images[0]?.alt || product.name,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  mrp: product.mrp,
                  sellingPrice: product.price,
                  stock: product.stock,
                  cartEnabled: product.stock > 0,
                  variants: product.variants,
                  badge: product.newArrival ? "New" : undefined,
                };
                return (
                  <div key={product.id}>
                    <ProductCard
                      product={cardProduct}
                      detailHref={`/product/${encodeURIComponent(product.slug)}`}
                    />
                    <p className="mt-3 text-xs leading-5 text-[#55696b]">
                      {reason}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded border border-dashed border-[#d7dfdc] bg-[#fbfcfa] p-6 text-sm text-[#55696b]">
              No products match every selected filter right now. Try a different
              category, preference, or budget.
            </div>
          )}
          <p className="mt-6 text-xs text-[#68787a]">
            Recommendations are based on product information and your
            selections, not medical advice.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-[#0b6472] hover:underline"
          >
            Browse all products <ArrowRight className="ml-2" size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
