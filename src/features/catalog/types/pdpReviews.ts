/** Nested `data.reviews` on PDP — published reviews of this market (setting), most useful first. */
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
  /** Already shortened by the server ("Ajay P."). */
  displayName: string | null;
  verifiedPurchase: boolean;
  /** When the shopper wrote it. */
  createdAt: string;
  helpfulCount: number;
  /** Public reply from Swiss Arabian. */
  reply: { text: string; repliedAt: string | null } | null;
  photos: Array<{ id: string; url: string; alt: string | null }>;
  variant: {
    variantId: string;
    variantName: string | null;
    sku: string | null;
  } | null;
};

export type ReviewSort = "useful" | "newest" | "rating_high" | "rating_low";

/** How reviews show (Admin → Products → Reviews → Settings). */
export type StorefrontReviewDisplay = {
  marketOnly: boolean;
  showVerifiedBadge: boolean;
  showReplies: boolean;
  minReviewsToShowStars: number;
};

export type StorefrontPdpReviews = {
  summary: StorefrontReviewSummary;
  items: StorefrontPublicReview[];
  total: number;
  limit: number;
  offset: number;
  sort: ReviewSort;
  display: StorefrontReviewDisplay;
};

export type StorefrontReviewPage = {
  items: StorefrontPublicReview[];
  total: number;
  limit: number;
  offset: number;
};
