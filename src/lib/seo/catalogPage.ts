import { cache } from "react";
import { shareImageFor } from "@/lib/seo/shareImage";
import { storefrontLogo } from "@/lib/storefront/brand";
import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import {
  loadBrandIdentityFor,
  namesBrand,
  type BrandIdentity,
} from "@/lib/seo/brandIdentity";
import {
  fetchCategoryBySlugOutcome,
  fetchCategoryProducts,
  fetchCollectionBySlug,
  fetchCollectionProducts,
  fetchProductBySlugOutcome,
  fetchProducts,
} from "@/features/catalog/api/catalog.service";
import { fetchStorefrontMarkets } from "@/features/markets/api/markets.service";
import { marketContentLanguage } from "@/features/markets/utils/marketContentLanguage";
import { fetchPublishedHome } from "@/features/cms/api/cmsContent.service";
import type { CmsHomeResult } from "@/features/cms/types/cmsHome.types";
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

function marketContext(
  market: StorefrontMarket,
  locale: ShopLocale,
): StorefrontContextInput {
  return {
    zoneCode: market.zoneCode,
    languageCode: locale,
    currencyCode:
      market.catalogContext.currencyCode ?? market.defaultCurrencyCode,
    countryCode: market.catalogContext.countryCode || market.countryCode,
    salesChannelCode:
      market.salesChannelCode ?? market.catalogContext.salesChannelCode,
    zoneId: market.zoneId,
    brandId: market.catalogContext.brandId,
    brandCode: market.catalogContext.brandCode,
  };
}

/** Host market, unless the shopper has chosen another country. Language stays the path. */
export async function resolveServerCatalogMarket() {
  const headerStore = await headers();
  const locale: ShopLocale =
    headerStore.get("x-shop-locale") === "ar" ? "ar" : "en";
  const zoneCookie = (await cookies()).get(ZONE_COOKIE)?.value?.trim() || "";
  let chosen: StorefrontMarket | null = null;
  try {
    const list = await fetchStorefrontMarkets();
    const ready = list.markets.filter((market) => market.isCatalogReady);
    const pool = ready.length ? ready : list.markets;
    chosen =
      (zoneCookie
        ? pool.find((market) => market.zoneCode === zoneCookie)
        : null) ??
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
    /** Code the market publishes content under for this language (e.g. "en-us"). */
    contentLanguage: chosen
      ? (marketContentLanguage(chosen.languages, locale) ?? locale)
      : "",
  };
}

/**
 * Published homepage sections, loaded on the server so the first HTML already has
 * the homepage (search engines, no layout jump). Null when it can't load: the
 * browser then loads it as before.
 */
export async function loadServerHome(): Promise<{
  zoneCode: string;
  languageCode: string;
  data: CmsHomeResult;
} | null> {
  const { zoneCode, contentLanguage } = await resolveServerCatalogMarket();
  if (!zoneCode || !contentLanguage) return null;
  try {
    const data = await fetchPublishedHome({
      zoneCode,
      languageCode: contentLanguage,
    });
    return { zoneCode, languageCode: contentLanguage, data };
  } catch {
    return null;
  }
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
  page = 1,
): Promise<{ listing: ProductListResult | null; missing: boolean }> {
  try {
    const listing = await fetchCollectionProducts(
      slug,
      zoneCode,
      { page, limit: 24 },
      market,
    );
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

export const loadCatalogDocument = cache(
  async (
    kind: "product" | "collection" | "category",
    slug: string,
    /** Collections: which page of products the server renders (?page=N). */
    listingPage = 1,
  ) => {
    const resolved = await resolveServerCatalogMarket();
    const empty = {
      product: null,
      collection: null,
      category: null,
      listing: null,
      missing: false,
    };
    if (!resolved.zoneCode) {
      return { ...resolved, ...empty };
    }
    if (kind === "product") {
      const { product, missing } = await fetchProductBySlugOutcome(
        slug,
        resolved.zoneCode,
        resolved.market,
      );
      return { ...resolved, ...empty, product, missing };
    }
    if (kind === "collection") {
      const [collection, initial] = await Promise.all([
        fetchCollectionBySlug(slug, resolved.zoneCode, resolved.market),
        loadInitialCollectionListing(
          slug,
          resolved.zoneCode,
          resolved.market,
          listingPage,
        ),
      ]);
      return {
        ...resolved,
        ...empty,
        collection,
        listing: initial.listing,
        missing: initial.missing && !collection,
      };
    }
    const { category, missing } = await fetchCategoryBySlugOutcome(
      slug,
      resolved.zoneCode,
      resolved.market,
    );
    return { ...resolved, ...empty, category, missing };
  },
);

/**
 * One page of "all products" or a category, rendered on the server so the HTML
 * search engines read already has the product links. Null when it can't load
 * (the browser then loads the products as before).
 */
export const loadServerListing = cache(
  async (
    kind: "products" | "category",
    slug: string,
    page: number,
  ): Promise<{ listing: ProductListResult | null; zoneCode: string }> => {
    const resolved = await resolveServerCatalogMarket();
    if (!resolved.zoneCode) return { listing: null, zoneCode: "" };
    const options = { page: Math.max(1, page || 1), limit: 24 };
    try {
      const listing =
        kind === "products"
          ? await fetchProducts(resolved.zoneCode, options, resolved.market)
          : await fetchCategoryProducts(
              slug,
              resolved.zoneCode,
              options,
              resolved.market,
            );
      return { listing, zoneCode: resolved.zoneCode };
    } catch {
      return { listing: null, zoneCode: resolved.zoneCode };
    }
  },
);

export async function catalogRequestMarket() {
  return resolveServerCatalogMarket();
}

/** Brand identity for the request's market and language (SEO Management). */
export async function loadRequestBrandIdentity(): Promise<BrandIdentity> {
  const { locale, zoneCode } = await resolveServerCatalogMarket();
  return loadBrandIdentityFor(locale, zoneCode);
}

/** `og:locale` from the shopper's language and the market's country ("ar_QA"). */
export function openGraphLocale(
  language: string,
  countryCode?: string | null,
): string {
  const lang = language.toLowerCase().split(/[-_]/)[0] || "en";
  const country = countryCode?.trim().toUpperCase();
  return country ? `${lang}_${country}` : lang;
}

export type CatalogMetadataInput = {
  locale: ShopLocale;
  path: string;
  title: string;
  description?: string;
  /** Share image (product main image / collection banner). */
  image?: string | null;
  /**
   * "product": the product page writes og:type=product and its price itself
   * (Next has no product type). Every other page is og:type=website (as Shopify).
   */
  ogType?: "website" | "product";
};

/** Page metadata for the request's market, named after its brand identity. */
export async function catalogMetadata(
  input: CatalogMetadataInput,
): Promise<Metadata> {
  const { zoneCode, market } = await resolveServerCatalogMarket();
  const brand = await loadBrandIdentityFor(input.locale, zoneCode);
  return buildCatalogMetadata(input, {
    brand,
    countryCode: "countryCode" in market ? market.countryCode : null,
  });
}

export function buildCatalogMetadata(
  input: CatalogMetadataInput,
  context: {
    brand: Pick<BrandIdentity, "name" | "names"> &
      Partial<Pick<BrandIdentity, "shareImage" | "logo">>;
    countryCode?: string | null;
  },
): Metadata {
  const alternates = catalogAlternates(input.path, input.locale);
  // Link previews: the page's own image, else the market's default share
  // image (Shopify: Preferences → social sharing image), else the brand logo.
  // Served as a JPEG at a fixed size (see shareImage.ts). Alt text: the title.
  const shape = input.ogType === "product" ? "square" : "wide";
  // First image that exists wins; it is converted when it is on our hosts,
  // else used as it is (a page's own image always beats the logo).
  const source = [
    input.image,
    context.brand.shareImage,
    context.brand.logo,
    storefrontLogo().src,
  ]
    .map((src) => src?.trim())
    .find((src): src is string => Boolean(src));
  const images = source
    ? [
        shareImageFor(source, shape, input.title) ?? {
          url: source,
          alt: input.title,
        },
      ]
    : undefined;
  const otherLocale = input.locale === "ar" ? "en" : "ar";
  return {
    // Imported SEO titles often name the brand already ("… | Swiss Arabian UAE"):
    // the site suffix is not added a second time (any language of the name).
    title: namesBrand(input.title, context.brand.names)
      ? { absolute: input.title }
      : input.title,
    description: input.description,
    alternates,
    openGraph: {
      ...(input.ogType === "product" ? {} : { type: "website" as const }),
      title: input.title,
      description: input.description,
      url: alternates.canonical,
      siteName: context.brand.name,
      locale: openGraphLocale(input.locale, context.countryCode),
      // The same page exists in the other language (hreflang twin for social apps).
      alternateLocale: [openGraphLocale(otherLocale, context.countryCode)],
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

export function canonicalCatalogPath(pathname: string, locale: ShopLocale) {
  return withLocalePrefix(pathname, locale);
}

export function localeOfRequestPath(pathname: string): ShopLocale {
  return localeFromPathname(pathname);
}
