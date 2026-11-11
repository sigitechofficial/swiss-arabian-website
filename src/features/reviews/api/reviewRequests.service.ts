import { apiGet, apiPost } from "@/lib/api/apiClient";

export type ReviewRequestProduct = {
  productId: string;
  name: string;
  slug: string | null;
  image: string | null;
  review: { rating: number; status: string } | null;
};

export type ReviewRequestView = {
  orderNumber: string;
  firstName: string | null;
  displayName: string;
  expired: boolean;
  expiresAt: string;
  unsubscribed: boolean;
  products: ReviewRequestProduct[];
};

const base = (token: string) => `/storefront/review-requests/${encodeURIComponent(token)}`;

export function fetchReviewRequest(token: string) {
  return apiGet<ReviewRequestView>(base(token));
}

export function submitReviewRequestReview(
  token: string,
  input: { productId: string; rating: number; title?: string; body?: string; displayName?: string },
) {
  return apiPost<{ reviewId: string; status: string }>(`${base(token)}/reviews`, input);
}

export function unsubscribeReviewEmails(token: string) {
  return apiPost<{ unsubscribed: boolean }>(`${base(token)}/unsubscribe`, {});
}
