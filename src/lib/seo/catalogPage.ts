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
import type { ProductListResult } from "@/features/catalog/api/catalog.service";
import { ApiClientError } from "@/lib/api/apiError";
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

/**
 * First page of a collection for server rendering.
 * - `missing`: the API answered 404 — the collection does not exist in this
 *   market, so the page must respond 404 (not 500, not an empty 200).
 * - Any other failure leaves `listing` null: the page still renders and the
 *   client view loads the grid itself (and shows its own error state).
 */
async function loadInitialCollectionListing(
  slug: string,
  zoneCode: string,
  market: StorefrontContextInput,
): Promise<{ listing: ProductListResult | null; missing: boolean }> {
  try {
    const listing = await fetchCollectionProducts(slug, zoneCode, { page: 1, limit: 24 }, market);
    return { listing, missing: false };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return { listing: null, missing: true };
    }
    console.error("[catalog] collection listing prefetch failed", {
      slug,
      zoneCode,
      error: error instanceof Error ? error.message : String(error),
      requestId: error instanceof ApiClientError ? error.requestId : undefined,
    });
    return { listing: null, missing: false };
  }
}

export const loadCatalogDocument = cache(async (kind: "product" | "collection" | "category", slug: string) => {
  const resolved = await resolveServerCatalogMarket();
  const empty = { product: null, collection: null, category: null, listing: null, missing: false };
  if (!resolved.zoneCode) {
    return { ...resolved, ...empty };
  }
  if (kind === "product") {
    const product = await fetchProductBySlug(slug, resolved.zoneCode, resolved.market);
    return { ...resolved, ...empty, product };
  }
  if (kind === "collection") {
    const [collection, initial] = await Promise.all([
      fetchCollectionBySlug(slug, resolved.zoneCode, resolved.market),
      loadInitialCollectionListing(slug, resolved.zoneCode, resolved.market),
    ]);
    return {
      ...resolved,
      ...empty,
      collection,
      listing: initial.listing,
      missing: initial.missing && !collection,
    };
  }
  const category = await fetchCategoryBySlug(slug, resolved.zoneCode, resolved.market);
  return { ...resolved, ...empty, category };
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
