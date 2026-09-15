export type StorefrontHomepageContextView = {
  zoneId: string | null;
  zoneCode: string | null;
  salesChannelCode: string | null;
  languageCode: string | null;
  currencyCode: string | null;
  legalEntityCode: string | null;
};

export type StorefrontProductCard = {
  productId: string;
  variantId: string | null;
  sku: string | null;
  slug: string | null;
  name: string;
  shortDescription: string | null;
  image: string | null;
  images: Array<{
    url: string;
    altText: string | null;
    sortOrder: number | null;
    mediaType: string | null;
  }> | null;
  priceSummary: Record<string, unknown> | null;
  inventorySummary: Record<string, unknown> | null;
  isVisible: boolean;
  isSellable: boolean;
  sellabilityStatus: string | null;
  blockReasons: string[];
  badges: string[] | null;
  tags?: string[] | null;
};

export type StorefrontMerchandisingDetailView = {
  context: StorefrontHomepageContextView;
  item: {
    id: string;
    code: string;
    slug: string | null;
    name: string;
    description: string | null;
    sortOrder: number;
    productCount: number | null;
    image: string | null;
    imageAlt: string | null;
  };
  products: StorefrontProductCard[];
};
