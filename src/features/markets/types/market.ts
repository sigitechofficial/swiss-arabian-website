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
  /**
   * The market's own website (`https://ksa.swissarabian.com`); null when it has
   * none yet. Older backends omit it.
   */
  storefrontUrl?: string | null;
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
  /** Price-edit tiers, e.g. [50, 99, 199]. Older backends omit it. */
  priceEditTiers?: number[] | null;
  /** Delivery promises (free-delivery threshold, standard / express, COD). Older backends omit it. */
  delivery?: StorefrontMarketDelivery | null;
};

/** One delivery method's promise (admin Market → Shipping). Money is a decimal string. */
export type StorefrontMarketDeliveryMethod = {
  methodCode: string;
  methodType: string | null;
  displayName: string | null;
  fee: string | null;
  freeDeliveryThreshold: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
};

/** Same as `StorefrontMarketDeliveryMethod` (name used by the shell / home code). */
export type StorefrontMarketDeliveryPromise = StorefrontMarketDeliveryMethod;

export type StorefrontMarketDelivery = {
  currencyCode: string | null;
  freeDeliveryThreshold: string | null;
  standard: StorefrontMarketDeliveryMethod | null;
  express: StorefrontMarketDeliveryMethod | null;
  cashOnDelivery: {
    available: boolean;
    minOrderAmount: string | null;
    maxOrderAmount: string | null;
    /** Always null today: the platform has no COD fee. */
    fee: string | null;
  } | null;
};

export type StorefrontMarketListResponse = {
  markets: StorefrontMarket[];
  defaultMarket: StorefrontMarket | null;
  /**
   * The market of the address itself (`ksa.swissarabian.com` → KSA). It decides
   * the market: no cookie or picker overrides it. Null when the address serves
   * no single market. Older backends omit it.
   */
  siteMarketCode?: string | null;
  /** The brand's default market (hreflang x-default). Older backends omit it. */
  brandDefaultMarketCode?: string | null;
};
