export type StorefrontWishlistProductSummaryView = {
  productId: string;
  slug: string | null;
  name: string;
  image: string | null;
  currency: string | null;
  priceSummary: Record<string, unknown> | null;
  isVisible: boolean;
  isSellable: boolean;
  sellabilityStatus: string | null;
  variantId: string | null;
  sku: string | null;
};

export type StorefrontWishlistItemView = {
  productId: string;
  addedAt: string;
  product: StorefrontWishlistProductSummaryView | null;
};

export type StorefrontWishlistListView = {
  items: StorefrontWishlistItemView[];
  total: number;
  limit: number;
  offset: number;
};

export type StorefrontWishlistStatusItem = {
  productId: string;
  inWishlist: boolean;
};

export type StorefrontWishlistStatusView = {
  items: StorefrontWishlistStatusItem[];
};

export type StorefrontWishlistAddResult = {
  productId: string;
  addedAt: string;
  alreadyPresent: boolean;
};

export type StorefrontWishlistRemoveResult = {
  productId: string;
  removed: boolean;
};

export type StorefrontWishlistClearResult = {
  cleared: true;
  itemCount: number;
};
