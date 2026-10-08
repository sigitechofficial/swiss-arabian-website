export type ReviewSort = "newest" | "rating_high" | "rating_low" | "helpful";

export type StorefrontReviewSummaryView = {
  productId: string;
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: { "1": number; "2": number; "3": number; "4": number; "5": number };
  verifiedPurchaseCount: number;
};

export type StorefrontPublicReviewView = {
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

export type StorefrontPublicReviewListView = {
  productId: string;
  items: StorefrontPublicReviewView[];
  total: number;
  limit: number;
  offset: number;
};

export type HelpfulMarkResult = {
  reviewId: string;
  helpfulCount: number;
  alreadyMarked: boolean;
};

export type HelpfulRemoveResult = {
  reviewId: string;
  helpfulCount: number;
  removed: boolean;
};

export type CustomerReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "HIDDEN"
  | "DELETED";

export type StorefrontCustomerReviewView = {
  reviewId: string;
  productId: string;
  variantId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  displayName: string | null;
  status: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  product: {
    productId: string;
    slug: string | null;
    name: string | null;
    image: string | null;
  } | null;
  variant: {
    variantId: string;
    variantName: string | null;
    sku: string | null;
  } | null;
};

export type StorefrontCustomerReviewListView = {
  items: StorefrontCustomerReviewView[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateReviewDto = {
  productId?: string;
  productSlug?: string;
  rating: number;
  title?: string;
  body?: string;
  displayName?: string;
  variantId?: string;
};

export type UpdateReviewDto = {
  rating?: number;
  title?: string;
  body?: string;
  displayName?: string;
};

export type DeleteReviewResult = {
  reviewId: string;
  deleted: boolean;
};
