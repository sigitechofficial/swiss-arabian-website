import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import { storefrontContextQuery, type StorefrontContextInput } from "@/lib/storefront/context";
import type { ReviewSort, StorefrontReviewPage } from "../types/pdpReviews";
import { parseReviewPage } from "../utils/pdpReviews";

export type CreateCustomerReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  displayName?: string;
  variantId?: string;
};

/** Returns the review's status: APPROVED (live now) or PENDING (checked by the team first). */
export async function createCustomerReview(
  input: CreateCustomerReviewInput,
  zoneCode?: string | null,
): Promise<{ status: string | null }> {
  const qs = storefrontContextQuery({ zoneCode });
  const data = await apiPost<{ status?: string } | undefined>(`/storefront/customer/reviews?${qs}`, {
    productId: input.productId,
    rating: input.rating,
    ...(input.title ? { title: input.title } : {}),
    ...(input.body ? { body: input.body } : {}),
    ...(input.displayName ? { displayName: input.displayName } : {}),
    ...(input.variantId ? { variantId: input.variantId } : {}),
  });
  return { status: data?.status ?? null };
}

/** A page of published reviews (this market, per the setting) with filters and order. */
export async function fetchProductReviews(
  productId: string,
  opts: {
    sort: ReviewSort;
    verified?: boolean;
    rating?: number | null;
    offset?: number;
    limit?: number;
  },
  market?: StorefrontContextInput | null,
): Promise<StorefrontReviewPage> {
  const params = new URLSearchParams(storefrontContextQuery(market ?? {}));
  params.set("sort", opts.sort);
  params.set("limit", String(opts.limit ?? 24));
  params.set("offset", String(opts.offset ?? 0));
  if (opts.verified) params.set("verified", "true");
  if (opts.rating) params.set("rating", String(opts.rating));
  const data = await apiGet<unknown>(
    `/storefront/catalog/products/${encodeURIComponent(productId)}/reviews?${params}`,
  );
  return parseReviewPage(data);
}

/** Signed-in customers only. Marking twice is harmless. */
export async function markReviewHelpful(reviewId: string, on: boolean): Promise<number | null> {
  const path = `/storefront/catalog/reviews/${encodeURIComponent(reviewId)}/helpful`;
  const data = on
    ? await apiPost<{ helpfulCount?: number } | undefined>(path, {})
    : await apiDelete<{ helpfulCount?: number } | undefined>(path);
  return typeof data?.helpfulCount === "number" ? data.helpfulCount : null;
}

/** Signed-in customers only, once per review. 3 reports send it back to the team. */
export async function reportReview(reviewId: string): Promise<void> {
  await apiPost(`/storefront/catalog/reviews/${encodeURIComponent(reviewId)}/report`, {});
}
