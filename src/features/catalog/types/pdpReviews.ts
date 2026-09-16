/** Nested `data.reviews` on PDP — APPROVED only, newest 8. */
export type StorefrontReviewSummary = {
  productId: string;
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  verifiedPurchaseCount: number;
};

export type StorefrontPublicReview = {
  reviewId: string;
  rating: number;
  title: string | null;
  body: string | null;
  displayName: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  variant: {
    variantId: string;
    variantName: string | null;
    sku: string | null;
  } | null;
};

export type StorefrontPdpReviews = {
  summary: StorefrontReviewSummary;
  items: StorefrontPublicReview[];
  total: number;
  limit: number;
  offset: number;
};
