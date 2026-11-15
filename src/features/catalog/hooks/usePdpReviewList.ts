"use client";

import { useState } from "react";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { toastApiError } from "@/lib/api/toastApiError";
import { fetchProductReviews } from "../api/reviews.service";
import type { ReviewSort, StorefrontPdpReviews, StorefrontPublicReview } from "../types/pdpReviews";

export type ReviewFilters = { sort: ReviewSort; verified: boolean; rating: number | null };

/**
 * The product page's review list, shared by every brand: starts from the
 * reviews the product payload carries, then sorts / filters (verified, star
 * rating) and pages through `GET …/products/:id/reviews` (this market only).
 * `shown` grows by `nextRow` with "View more"; pages load only when needed.
 */
export function usePdpReviewList(
  productId: string,
  reviews: StorefrontPdpReviews | null | undefined,
  {
    firstRow,
    nextRow,
    pageSize = 24,
    onError = toastApiError,
  }: { firstRow: number; nextRow: number; pageSize?: number; onError?: (error: unknown) => void },
) {
  const market = useSelectedCatalogMarket();
  const [sort, setSort] = useState<ReviewSort>(reviews?.sort ?? "useful");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [items, setItems] = useState<StorefrontPublicReview[]>(reviews?.items ?? []);
  const [total, setTotal] = useState(reviews?.total ?? 0);
  const [shown, setShown] = useState(firstRow);
  const [loading, setLoading] = useState(false);

  async function load(next: ReviewFilters, offset = 0) {
    setLoading(true);
    try {
      const page = await fetchProductReviews(
        productId,
        { sort: next.sort, verified: next.verified, rating: next.rating, offset, limit: pageSize },
        market,
      );
      setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
      setTotal(page.total);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(next: Partial<ReviewFilters>) {
    const value: ReviewFilters = {
      sort: next.sort ?? sort,
      verified: next.verified ?? verifiedOnly,
      rating: next.rating === undefined ? starFilter : next.rating,
    };
    setSort(value.sort);
    setVerifiedOnly(value.verified);
    setStarFilter(value.rating);
    setShown(firstRow);
    void load(value);
  }

  async function viewMore() {
    const nextShown = shown + nextRow;
    if (nextShown > items.length && items.length < total) {
      await load({ sort, verified: verifiedOnly, rating: starFilter }, items.length);
    }
    setShown(nextShown);
  }

  return {
    sort,
    verifiedOnly,
    starFilter,
    items,
    total,
    shown,
    loading,
    visible: items.slice(0, shown),
    /** More reviews exist (loaded or not) than are shown. */
    hasMore: shown < items.length || items.length < total,
    applyFilters,
    viewMore,
  };
}
