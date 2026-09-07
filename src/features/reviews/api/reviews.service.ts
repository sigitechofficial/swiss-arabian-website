import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/apiClient";
import {
  DEFAULT_ZONE_CODE,
  storefrontContextQuery,
  toAuthSalesChannelCode,
} from "@/lib/storefront/context";
import type {
  CreateReviewDto,
  DeleteReviewResult,
  HelpfulMarkResult,
  HelpfulRemoveResult,
  ReviewSort,
  StorefrontCustomerReviewListView,
  StorefrontCustomerReviewView,
  StorefrontPublicReviewListView,
  StorefrontReviewSummaryView,
  UpdateReviewDto,
} from "../types/reviews";

export const REVIEWS_PAGE_SIZE = 20;
export const MY_REVIEWS_PAGE_SIZE = 20;

function reviewsContextQuery(zoneCode?: string | null): string {
  return storefrontContextQuery({
    zoneCode: zoneCode?.trim() || DEFAULT_ZONE_CODE,
    salesChannelCode: toAuthSalesChannelCode(zoneCode),
  });
}

function productReviewsPath(productIdOrSlug: string, suffix = ""): string {
  return `/storefront/catalog/products/${encodeURIComponent(productIdOrSlug)}/reviews${suffix}`;
}

export async function fetchReviewSummary(
  productIdOrSlug: string,
  zoneCode?: string | null,
): Promise<StorefrontReviewSummaryView> {
  const qs = reviewsContextQuery(zoneCode);
  return apiGet<StorefrontReviewSummaryView>(
    `${productReviewsPath(productIdOrSlug, "/summary")}?${qs}`,
    { skipAuth: true },
  );
}

export async function fetchPublicReviews(
  productIdOrSlug: string,
  opts: {
    zoneCode?: string | null;
    sort?: ReviewSort;
    limit?: number;
    offset?: number;
  } = {},
): Promise<StorefrontPublicReviewListView> {
  const params = new URLSearchParams(reviewsContextQuery(opts.zoneCode));
  params.set("sort", opts.sort ?? "newest");
  params.set("limit", String(opts.limit ?? REVIEWS_PAGE_SIZE));
  params.set("offset", String(opts.offset ?? 0));
  return apiGet<StorefrontPublicReviewListView>(
    `${productReviewsPath(productIdOrSlug)}?${params.toString()}`,
    { skipAuth: true },
  );
}

export async function markReviewHelpful(
  reviewId: string,
): Promise<HelpfulMarkResult> {
  return apiPost<HelpfulMarkResult>(
    `/storefront/catalog/reviews/${encodeURIComponent(reviewId)}/helpful`,
  );
}

export async function removeReviewHelpful(
  reviewId: string,
): Promise<HelpfulRemoveResult> {
  return apiDelete<HelpfulRemoveResult>(
    `/storefront/catalog/reviews/${encodeURIComponent(reviewId)}/helpful`,
  );
}

export async function createReview(
  dto: CreateReviewDto,
  zoneCode?: string | null,
): Promise<StorefrontCustomerReviewView> {
  const qs = reviewsContextQuery(zoneCode);
  return apiPost<StorefrontCustomerReviewView>(
    `/storefront/customer/reviews?${qs}`,
    dto,
  );
}

export async function fetchMyReviews(opts: {
  status?: string | null;
  limit?: number;
  offset?: number;
} = {}): Promise<StorefrontCustomerReviewListView> {
  const params = new URLSearchParams();
  if (opts.status?.trim()) params.set("status", opts.status.trim());
  params.set("limit", String(opts.limit ?? MY_REVIEWS_PAGE_SIZE));
  params.set("offset", String(opts.offset ?? 0));
  return apiGet<StorefrontCustomerReviewListView>(
    `/storefront/customer/reviews?${params.toString()}`,
  );
}

export async function fetchMyReview(
  reviewId: string,
): Promise<StorefrontCustomerReviewView> {
  return apiGet<StorefrontCustomerReviewView>(
    `/storefront/customer/reviews/${encodeURIComponent(reviewId)}`,
  );
}

export async function updateReview(
  reviewId: string,
  dto: UpdateReviewDto,
): Promise<StorefrontCustomerReviewView> {
  return apiPatch<StorefrontCustomerReviewView>(
    `/storefront/customer/reviews/${encodeURIComponent(reviewId)}`,
    dto,
  );
}

export async function deleteReview(
  reviewId: string,
): Promise<DeleteReviewResult> {
  return apiDelete<DeleteReviewResult>(
    `/storefront/customer/reviews/${encodeURIComponent(reviewId)}`,
  );
}

export async function findOwnReviewForProduct(
  productId: string,
): Promise<StorefrontCustomerReviewView | null> {
  const data = await fetchMyReviews({ limit: 50, offset: 0 });
  return (
    data.items.find(
      (item) => item.productId === productId && item.status !== "DELETED",
    ) ?? null
  );
}
