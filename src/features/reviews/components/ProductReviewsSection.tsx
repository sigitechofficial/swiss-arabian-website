"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import {
  useAuthBootstrapped,
  useIsAuthenticated,
} from "@/hooks/useCurrentUser";
import {
  accountBtnGhost,
} from "@/features/account/constants/accountForm";
import {
  useOwnReviewForProduct,
  useProductReviewFeed,
  useProductReviewSummary,
} from "../hooks/useProductReviews";
import { useReviewMutations } from "../hooks/useReviewMutations";
import type {
  ReviewSort,
  StorefrontCustomerReviewView,
  StorefrontPublicReviewView,
} from "../types/reviews";
import { ReviewWriteForm } from "./ReviewWriteForm";
import { StarRating } from "./StarRating";

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "rating_high", label: "Highest rating" },
  { value: "rating_low", label: "Lowest rating" },
  { value: "helpful", label: "Most helpful" },
];

type ProductReviewsSectionProps = {
  productId: string;
  variantId?: string;
};

function loginReturnTo(): string {
  return `/login?returnTo=${encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  )}`;
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProductReviewsSection({
  productId,
  variantId,
}: ProductReviewsSectionProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const { markHelpful, unmarkHelpful } = useReviewMutations();

  const [sort, setSort] = useState<ReviewSort>("newest");
  const [writing, setWriting] = useState(false);
  const [existing, setExisting] = useState<StorefrontCustomerReviewView | null>(
    null,
  );
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(
    {},
  );

  const summary = useProductReviewSummary(productId);
  const feed = useProductReviewFeed(productId, sort);
  const ownQuery = useOwnReviewForProduct(
    productId,
    bootstrapped && isAuthenticated,
  );

  const ownReview = existing ?? ownQuery.data ?? null;
  const items = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data],
  );
  const reviewCount = summary.data?.reviewCount ?? 0;
  const showStars = reviewCount > 0;
  const total = feed.data?.pages[0]?.total ?? reviewCount;
  const breakdown = summary.data?.ratingBreakdown;
  const summaryPending = summary.isLoading && !summary.data;

  function requireLogin() {
    router.push(loginReturnTo());
  }

  function openWrite() {
    if (!bootstrapped) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    setExisting(ownReview);
    setWriting(true);
  }

  async function handleHelpful(review: StorefrontPublicReviewView) {
    if (!bootstrapped) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    const marked = markedIds.has(review.reviewId);
    try {
      if (marked) {
        const result = await unmarkHelpful.unwrap(review.reviewId);
        setHelpfulCounts((prev) => ({
          ...prev,
          [review.reviewId]: result.helpfulCount,
        }));
        if (result.removed) {
          setMarkedIds((prev) => {
            const next = new Set(prev);
            next.delete(review.reviewId);
            return next;
          });
        }
        return;
      }
      const result = await markHelpful.unwrap(review.reviewId);
      setHelpfulCounts((prev) => ({
        ...prev,
        [review.reviewId]: result.helpfulCount,
      }));
      setMarkedIds((prev) => new Set(prev).add(review.reviewId));
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        toast("This review is no longer available.", "error");
        return;
      }
      toast(getUserFacingErrorMessage(error), "error");
    }
  }

  const writeLabel = ownReview ? "Edit your review" : "Write a review";

  return (
    <section
      id="product-reviews"
      className="bg-page py-6 sm:py-8"
      aria-label="Customer reviews"
    >
      <div className="mx-auto max-w-[560px] px-4 text-center sm:px-6">
        <h2 className="font-sans text-[22px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[26px]">
          Reviews
        </h2>

        {summaryPending ? (
          <p className="mt-2 text-[13px] text-sa-secondary">Loading…</p>
        ) : summary.isError ? (
          <p className="mt-2 text-[13px] text-sa-secondary">
            Reviews could not be loaded right now.
          </p>
        ) : showStars && summary.data ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <StarRating value={summary.data.averageRating} readOnly size={16} />
            <span className="text-[14px] font-semibold text-sa-primary">
              {summary.data.averageRating.toFixed(1)}
            </span>
            <span className="text-[13px] text-sa-secondary">
              {reviewCount === 1 ? "1 review" : `${reviewCount} reviews`}
            </span>
          </div>
        ) : null}

        {showStars && breakdown ? (
          <div className="mx-auto mt-5 max-w-[280px] text-left">
            <RatingBreakdown breakdown={breakdown} total={reviewCount} />
          </div>
        ) : null}

        {!writing ? (
          <button
            type="button"
            className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center bg-terra px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#a25e48] disabled:cursor-wait disabled:opacity-60"
            onClick={openWrite}
            disabled={!bootstrapped}
          >
            {writeLabel}
          </button>
        ) : (
          <div className="mt-6 text-left">
            {ownReview?.status === "PENDING" ? (
              <p className="mb-3 text-center text-[13px] text-sa-secondary">
                Your review is waiting for approval and is not shown here yet.
              </p>
            ) : null}
            <ReviewWriteForm
              key={ownReview?.reviewId ?? "new"}
              productId={productId}
              variantId={variantId}
              existing={ownReview}
              onCancel={() => setWriting(false)}
              onSubmitted={(saved) => {
                setExisting(saved);
                setWriting(false);
              }}
              onConflict={async (found) => {
                setExisting(found);
              }}
            />
          </div>
        )}

        {!writing && ownReview && !showStars ? (
          <p className="mt-3 text-[13px] text-sa-secondary">
            Submitted — visible after approval.{" "}
            <Link
              href="/account/reviews"
              className="font-semibold text-terra hover:underline"
            >
              View your reviews
            </Link>
          </p>
        ) : null}
      </div>

      {showStars ? (
        <div className="mx-auto mt-10 max-w-[720px] px-4 text-left sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-sa-secondary">
              {total} {total === 1 ? "review" : "reviews"}
            </p>
            <label className="flex items-center gap-2 text-[13px] text-sa-secondary">
              Sort
              <select
                className="h-10 cursor-pointer rounded-md border border-sa-input bg-page px-3 text-[13px] text-sa-primary"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as ReviewSort)
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {feed.isError ? (
            <p className="mt-4 text-[14px] text-sa-secondary">
              Reviews could not be loaded right now.
            </p>
          ) : items.length === 0 && feed.isLoading ? (
            <p className="mt-4 text-[14px] text-sa-secondary">Loading reviews…</p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y divide-sa-border border-y border-sa-border">
              {items.map((review) => (
                <li key={review.reviewId} className="py-6">
                  <PublicReviewCard
                    review={{
                      ...review,
                      helpfulCount:
                        helpfulCounts[review.reviewId] ?? review.helpfulCount,
                    }}
                    marked={markedIds.has(review.reviewId)}
                    pending={markHelpful.isPending || unmarkHelpful.isPending}
                    onHelpful={() => void handleHelpful(review)}
                  />
                </li>
              ))}
            </ul>
          )}

          {feed.hasNextPage ? (
            <button
              type="button"
              className={`${accountBtnGhost} mt-5`}
              disabled={feed.isFetchingNextPage}
              onClick={() => void feed.fetchNextPage()}
            >
              {feed.isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function RatingBreakdown({
  breakdown,
  total,
}: {
  breakdown: { "1": number; "2": number; "3": number; "4": number; "5": number };
  total: number;
}) {
  const stars = [5, 4, 3, 2, 1] as const;
  return (
    <div className="max-w-[420px] space-y-2">
      {stars.map((star) => {
        const count = breakdown[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
        const width = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-[12px] text-sa-secondary">
            <span className="w-10 shrink-0">{star} star</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sa-border">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function PublicReviewCard({
  review,
  marked,
  pending,
  onHelpful,
}: {
  review: StorefrontPublicReviewView;
  marked: boolean;
  pending: boolean;
  onHelpful: () => void;
}) {
  const name = review.displayName?.trim() || "Customer";
  const date = formatReviewDate(review.createdAt);

  return (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <StarRating value={review.rating} readOnly size={14} />
        <span className="text-[14px] font-semibold text-sa-primary">{name}</span>
        {review.verifiedPurchase ? (
          <span className="rounded-full bg-[#f6ece8] px-2.5 py-0.5 text-[11px] font-semibold text-terra">
            Verified purchase
          </span>
        ) : null}
        {date ? (
          <span className="text-[12px] text-sa-muted">{date}</span>
        ) : null}
      </div>
      {review.variant?.variantName ? (
        <p className="mt-1 text-[12px] text-sa-muted">{review.variant.variantName}</p>
      ) : null}
      {review.title ? (
        <h3 className="mt-3 text-[15px] font-semibold text-sa-primary">
          {review.title}
        </h3>
      ) : null}
      {review.body ? (
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-sa-secondary">
          {review.body}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onHelpful}
        disabled={pending}
        aria-pressed={marked}
        className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold ${
          marked ? "text-terra" : "text-sa-secondary hover:text-terra"
        }`}
      >
        <ThumbsUp className="size-3.5" strokeWidth={2} />
        Helpful
        {review.helpfulCount > 0 ? (
          <span className="font-normal">({review.helpfulCount})</span>
        ) : null}
      </button>
    </article>
  );
}
