import type { StorefrontPdpMetafields } from "./pdpMetafields";
import type { StorefrontPdpReviews } from "./pdpReviews";
import type { StorefrontShippingPromise } from "./pdpShipping";

export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: number | null;
  currency: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  sku?: string;
  variantId?: string;
  isSellable?: boolean;
  isVisible?: boolean;
  sellabilityStatus?: string;
  inStock?: boolean;
  availableQty?: number;
  blockReasons?: string[];
  /** Raw catalog tags. UI maps a shopper allowlist — see productBadges.ts. */
  tags?: string[];
  concentration?: "extrait" | "edp" | null;
  houseCollection?: string | null;
  featuredNote?: string | null;
  /** Server-side fragrance_family_text codes (not PDP pyramid notes). */
  fragranceFamilyCodes?: string[];
};

export type ProductCollectionRef = {
  name: string;
  slug: string;
  isFeatured?: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string;
  descriptionHtml?: string;
  seoTitle?: string;
  seoDescription?: string;
  variantId: string;
  brandName?: string;
  collections?: ProductCollectionRef[];
  pdpMetafields?: StorefrontPdpMetafields;
  prVideo?: { url: string; name: string | null };
  shippingPromise?: StorefrontShippingPromise | null;
  reviews?: StorefrontPdpReviews | null;
};
