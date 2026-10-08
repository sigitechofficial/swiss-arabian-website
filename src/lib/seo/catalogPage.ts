import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import {
  fetchCategoryBySlug,
  fetchCollectionBySlug,
  fetchCollectionProducts,
  fetchProductBySlug,
} from "@/features/catalog/api/catalog.service";
import { fetchStorefrontMarkets } from "@/features/markets/api/markets.service";
import type { StorefrontMarket } from "@/features/markets/types/market";
import { ZONE_COOKIE } from "@/features/markets/utils/zoneCookie";
import type { StorefrontContextInput } from "@/lib/storefront/context";
import {
  catalogAlternates,
  localeFromPathname,
  type ShopLocale,
  withLocalePrefix,
} from "@/lib/i18n/localePath";

function marketContext(market: StorefrontMarket, locale: ShopLocale): StorefrontContextInput {
  return {
    zoneCode: market.zoneCode,
    languageCode: locale,
    currencyCode: market.catalogContext.currencyCode ?? market.defaultCurrencyCode,
    countryCode: market.catalogContext.countryCode || market.countryCode,
    salesChannelCode: market.salesChannelCode ?? market.catalogContext.salesChannelCode,
    zoneId: market.zoneId,
    brandId: market.catalogContext.brandId,
    brandCode: market.catalogContext.brandCode,
  };
}

/** Host market, unless the shopper has chosen another country. Language stays the path. */
export async function resolveServerCatalogMarket() {
  const headerStore = await headers();
  const locale: ShopLocale = headerStore.get("x-shop-locale") === "ar" ? "ar" : "en";
  const zoneCookie = (await cookies()).get(ZONE_COOKIE)?.value?.trim() || "";
  let chosen: StorefrontMarket | null = null;
  try {
    const list = await fetchStorefrontMarkets();
    const ready = list.markets.filter((market) => market.isCatalogReady);
    const pool = ready.length ? ready : list.markets;
    chosen =
      (zoneCookie ? pool.find((market) => market.zoneCode === zoneCookie) : null) ??
      list.defaultMarket ??
      pool[0] ??
      null;
  } catch {
    chosen = null;
  }
  const zoneCode = chosen?.zoneCode ?? "";
  return {
    locale,
    zoneCode,
    market: chosen ? marketContext(chosen, locale) : { languageCode: locale },
  };
}

export const loadCatalogDocument = cache(async (kind: "product" | "collection" | "category", slug: string) => {
  const resolved = await resolveServerCatalogMarket();
  if (!resolved.zoneCode) {
    return { ...resolved, product: null, collection: null, category: null, listing: null };
  }
  if (kind === "product") {
    const product = await fetchProductBySlug(slug, resolved.zoneCode, resolved.market);
    return { ...resolved, product, collection: null, category: null, listing: null };
  }
  if (kind === "collection") {
    const [collection, listing] = await Promise.all([
      fetchCollectionBySlug(slug, resolved.zoneCode, resolved.market),
      fetchCollectionProducts(slug, resolved.zoneCode, { page: 1, limit: 24 }, resolved.market),
    ]);
    return { ...resolved, product: null, collection, category: null, listing };
  }
  const category = await fetchCategoryBySlug(slug, resolved.zoneCode, resolved.market);
  return { ...resolved, product: null, collection: null, category, listing: null };
});

export async function catalogRequestMarket() {
  return resolveServerCatalogMarket();
}

export function catalogMetadata(input: {
  locale: ShopLocale;
  path: string;
  title: string;
  description?: string;
}): Metadata {
  const alternates = catalogAlternates(input.path, input.locale);
  return {
    title: input.title,
    description: input.description,
    alternates,
    openGraph: {
      title: input.title,
      description: input.description,
      url: alternates.canonical,
    },
  };
}

export function canonicalCatalogPath(pathname: string, locale: ShopLocale) {
  return withLocalePrefix(pathname, locale);
}

export function localeOfRequestPath(pathname: string): ShopLocale {
  return localeFromPathname(pathname);
}
