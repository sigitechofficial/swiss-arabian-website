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

export type ShopableVideoPriceSummary = {
  price: string | null;
  currencyCode: string | null;
  hasValidPrice: boolean;
};

export type ShopableVideoSlide = {
  productId: string;
  variantId: string | null;
  sku: string | null;
  slug: string | null;
  name: string;
  image: string | null;
  video: { url: string; name: string | null } | null;
  priceSummary: ShopableVideoPriceSummary | null;
  isSellable: boolean;
  isVisible: boolean;
  sortOrder: number | null;
};

export type ShopableVideoView = {
  context: StorefrontHomepageContextView;
  available: boolean;
  sectionTitle: string | null;
  collection: {
    id: string;
    code: string;
    slug: string | null;
    name: string;
  } | null;
  slides: ShopableVideoSlide[];
  metadata?: {
    generatedAt?: string;
    slideCount?: number;
  };
};

export type FragranceNoteTile = {
  code: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number | null;
  fragranceFamily: string;
};

export type FragranceNotesView = {
  context: StorefrontHomepageContextView;
  available: boolean;
  sectionTitle: string | null;
  collection: {
    id: string;
    code: string;
    slug: string | null;
    name: string;
  } | null;
  tiles: FragranceNoteTile[];
  metadata?: {
    generatedAt?: string;
    tileCount?: number;
  };
};
