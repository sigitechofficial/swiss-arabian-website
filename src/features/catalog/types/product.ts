import type { StorefrontPdpMetafields } from "./pdpMetafields";

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
};

export type ProductCollectionRef = {
  name: string;
  slug: string;
  isFeatured?: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string;
  descriptionHtml?: string;
  variantId: string;
  brandName?: string;
  collections?: ProductCollectionRef[];
  pdpMetafields?: StorefrontPdpMetafields;
};
