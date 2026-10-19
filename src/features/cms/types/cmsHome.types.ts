export type CmsSectionType =
  | "HERO_BANNER"
  | "IMAGE_BANNER"
  | "TEXT_BLOCK"
  | "CATEGORY_GRID"
  | "CATEGORY_CAROUSEL"
  | "PRODUCT_CAROUSEL"
  | "TRENDING_PRODUCTS"
  | "FEATURED_COLLECTION"
  | "IMAGE_WITH_TEXT"
  | "HERO_SLIDER"
  | "TRUST_INDICATORS"
  | "COLLECTION_SHOWCASE"
  | "TESTIMONIALS"
  | "BRAND_STORY"
  | "BUNDLE_PROMOTION_SHOWCASE"
  | "SUBSCRIPTION_PLANS_SHOWCASE"
  | "NEWSLETTER_SIGNUP"
  | "FRAGRANCE_NOTES_SHOWCASE"
  | "SHOPABLE_VIDEO_SHOWCASE";

export type CmsLinkType =
  | "NONE"
  | "PRODUCT"
  | "COLLECTION"
  | "CATEGORY"
  | "INTERNAL_PATH"
  | "EXTERNAL_URL";

export type CmsLink = {
  type: CmsLinkType;
  referenceId?: string | null;
  url?: string | null;
};

/** Backend StorefrontProductCard (as returned inside CMS section data.products). */
export type CmsProductCard = {
  productId: string;
  variantId?: string | null;
  sku?: string | null;
  slug?: string | null;
  name: string;
  shortDescription?: string | null;
  image?: string | null;
  images?: Array<{
    url: string;
    altText?: string | null;
    sortOrder?: number | null;
    mediaType?: string | null;
  }>;
  tags?: string[];
  priceSummary?: {
    price?: number | string | null;
    currencyCode?: string | null;
    hasValidPrice?: boolean;
  } | null;
  inventorySummary?: {
    availableQty?: number | string | null;
    hasAvailableInventory?: boolean;
  } | null;
  isVisible?: boolean;
  isSellable?: boolean;
  sellabilityStatus?: string | null;
  blockReasons?: string[];
};

export type CmsCategoryItem = {
  id: string;
  code?: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
};

export type CmsSection = {
  id: string;
  type: CmsSectionType | string;
  position: number;
  data: Record<string, unknown>;
};

export type CmsHomePageMeta = {
  type: string;
  id: string;
  variantId: string;
  locale: string;
  zoneCode: string;
};

export type CmsHomeResult = {
  page: CmsHomePageMeta | null;
  sections: CmsSection[];
};
