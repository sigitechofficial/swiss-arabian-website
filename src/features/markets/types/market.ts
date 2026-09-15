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
};

export type StorefrontMarketListResponse = {
  markets: StorefrontMarket[];
  defaultMarket: StorefrontMarket | null;
};
