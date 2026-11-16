import type { ProductSeoPackage } from "@/lib/seo/productSeo";
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
  /**
   * Pastel behind the product photo (design token key: pink, peach, butter,
   * mint, sky, lilac, sand, sage, lime), set in admin or derived from the
   * bottle colour. Null/absent: the brand's default tile.
   */
  tileColor?: string | null;
  /** Full price before a markdown (struck out next to `price`), when the API sends one. */
  compareAtPrice?: number | null;
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
  /** Admin product SEO package (canonical, robots, social, structured data). */
  seo?: ProductSeoPackage | null;
  variantId: string;
  brandName?: string;
  collections?: ProductCollectionRef[];
  pdpMetafields?: StorefrontPdpMetafields;
  prVideo?: { url: string; name: string | null };
  shippingPromise?: StorefrontShippingPromise | null;
  reviews?: StorefrontPdpReviews | null;
};
