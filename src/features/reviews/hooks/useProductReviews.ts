"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { reviewsKeys } from "../api/reviews.keys";
import {
  fetchMyReviews,
  fetchPublicReviews,
  fetchReviewSummary,
  findOwnReviewForProduct,
  MY_REVIEWS_PAGE_SIZE,
  REVIEWS_PAGE_SIZE,
} from "../api/reviews.service";
import type { ReviewSort } from "../types/reviews";

function retryUnlessNotFound(failureCount: number, error: Error) {
  if (error instanceof ApiClientError && error.status === 404) return false;
  return failureCount < 2;
}

export function useReviewZoneCode() {
  const { marketId } = useMarket();
  return marketId?.trim() || DEFAULT_ZONE_CODE;
}

export function useProductReviewSummary(
  productKey: string,
  enabled = true,
) {
  const zoneCode = useReviewZoneCode();
  return useApiQuery(
    reviewsKeys.summary(productKey, zoneCode),
    () => fetchReviewSummary(productKey, zoneCode),
    { enabled: enabled && Boolean(productKey), retry: retryUnlessNotFound },
  );
}

export function useProductReviewFeed(
  productKey: string,
  sort: ReviewSort,
  enabled = true,
) {
  const zoneCode = useReviewZoneCode();
  return useInfiniteQuery({
    queryKey: reviewsKeys.infinite(productKey, zoneCode, sort),
    queryFn: ({ pageParam }) =>
      fetchPublicReviews(productKey, {
        zoneCode,
        sort,
        limit: REVIEWS_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + lastPage.items.length;
      return next < lastPage.total ? next : undefined;
    },
    enabled: enabled && Boolean(productKey),
    retry: retryUnlessNotFound,
  });
}

export function useMyReviewsFeed(status?: string | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: reviewsKeys.mineInfinite(status),
    queryFn: ({ pageParam }) =>
      fetchMyReviews({
        status,
        limit: MY_REVIEWS_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + lastPage.items.length;
      return next < lastPage.total ? next : undefined;
    },
    enabled,
  });
}

export function useOwnReviewForProduct(productId: string, enabled = true) {
  return useApiQuery(
    [...reviewsKeys.mine(), "by-product", productId] as const,
    () => findOwnReviewForProduct(productId),
    { enabled: enabled && Boolean(productId) },
  );
}
