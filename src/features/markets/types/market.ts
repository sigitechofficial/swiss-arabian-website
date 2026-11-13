export type StorefrontMarketCurrency = {
  currencyCode: string;
  displayName: string | null;
  symbol: string | null;
  decimalPlaces: number;
  isDefault: boolean;
};

export type StorefrontMarketLanguage = {
  locale: string;
  languageCode: string;
  displayName: string | null;
  isDefault: boolean;
};

export type StorefrontMarketCatalogContext = {
  zoneId: string;
  zoneCode: string;
  salesChannelId: string | null;
  salesChannelCode: string | null;
  legalEntityCode: string | null;
  languageCode: string | null;
  currencyCode: string | null;
  countryCode: string;
  brandId?: string | null;
  brandCode?: string | null;
};

export type StorefrontMarket = {
  zoneId: string;
  zoneCode: string;
  name: string;
  countryCode: string;
  defaultCurrencyCode: string | null;
  defaultLocale: string | null;
  defaultLanguageCode: string | null;
  salesChannelId: string | null;
  salesChannelCode: string | null;
  primaryLegalEntityCode: string | null;
  isCatalogReady: boolean;
  currencies: StorefrontMarketCurrency[];
  languages: StorefrontMarketLanguage[];
  catalogContext: StorefrontMarketCatalogContext;
  /** Max prices for the "Under <currency> X" price edits, ascending (absent on older APIs). */
  priceEditTiers?: number[];
  /** Delivery and payment facts (absent on older APIs). */
  delivery?: StorefrontMarketDelivery;
};

/** A delivery method's promise (fee, free-delivery threshold, days). */
export type StorefrontMarketDeliveryPromise = {
  methodCode: string;
  methodType: string;
  displayName: string;
  fee: string | null;
  freeDeliveryThreshold: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
};

export type StorefrontMarketDelivery = {
  currencyCode: string | null;
  /** Lowest free-delivery threshold of the market's delivery methods (null = none). */
  freeDeliveryThreshold: string | null;
  standard: StorefrontMarketDeliveryPromise | null;
  express: StorefrontMarketDeliveryPromise | null;
  cashOnDelivery: {
    available: boolean;
    minOrderAmount: string | null;
    maxOrderAmount: string | null;
    fee: string | null;
  };
};

export type StorefrontMarketListResponse = {
  markets: StorefrontMarket[];
  defaultMarket: StorefrontMarket | null;
};
