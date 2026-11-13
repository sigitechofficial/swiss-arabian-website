import { cache } from "react";
import { shareImageFor } from "@/lib/seo/shareImage";
import { storefrontLogo } from "@/lib/storefront/brand";
import type { Metadata } from "next";
import {
  loadBrandIdentityFor,
  namesBrand,
  type BrandIdentity,
} from "@/lib/seo/brandIdentity";
import {
  fetchCategoryBySlugOutcome,
  fetchCategoryProducts,
  fetchCollectionBySlugOutcome,
  fetchCollectionProducts,
  fetchProductBySlugOutcome,
  fetchProducts,
  isCatalogUnavailable,
} from "@/features/catalog/api/catalog.service";
import { fetchPublishedHome } from "@/features/cms/api/cmsContent.service";
import type { CmsHomeResult } from "@/features/cms/types/cmsHome.types";
import type { ProductListResult } from "@/features/catalog/api/catalog.service";
import { ApiClientError } from "@/lib/api/apiError";
import type { StorefrontContextInput } from "@/lib/storefront/context";
import {
  catalogAlternates,
  localeFromPathname,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { LOCALES, type ShopLocale } from "@/lib/i18n/locales";
import { routeLocale } from "@/lib/i18n/routeLocale";
import {
  englishTranslator,
  getTranslator,
  type Translator,
} from "@/lib/i18n/messages";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";

export { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";

/**
 * The storefront's default market (this deployment's host) in the route's
 * language. Reads no request data, so catalog pages can be prerendered and
 * revalidated (ISR). A shopper who picked another market gets that market's
 * data from the browser (the client views compare `zoneCode`).
 */
export async function resolveServerCatalogMarket(locale?: ShopLocale) {
  return resolveCatalogMarketFor(locale ?? (await routeLocale()));
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
 * - API unreachable / 5xx: thrown, so the error view (with retry) shows and
 *   ISR never caches a broken or "not found" page.
 * - Any other failure (4xx) leaves `listing` null: the page still renders and
 *   the client view loads the grid itself (and shows its own error state).
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
    // API down / 5xx: the page errors (retry) rather than caching an empty
    // collection for the revalidate period.
    if (isCatalogUnavailable(error)) throw error;
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
      const [{ collection }, initial] = await Promise.all([
        fetchCollectionBySlugOutcome(slug, resolved.zoneCode, resolved.market),
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
export async function loadRequestBrandIdentity(locale?: ShopLocale): Promise<BrandIdentity> {
  const resolvedLocale = locale ?? (await routeLocale());
  const { zoneCode } = await resolveServerCatalogMarket(resolvedLocale);
  return loadBrandIdentityFor(resolvedLocale, zoneCode);
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
  /**
   * A product listing (all products, a collection, a category). Without its
   * own description it gets a short one naming the listing and the brand, so
   * search results never show a blank or random snippet.
   */
  listing?: boolean;
};

const META_DESCRIPTION_MAX = 160;

/** Plain text for a meta description: HTML tags removed, spaces collapsed, cut at a word near 160 characters. */
export function metaDescriptionText(raw: string | null | undefined): string | undefined {
  const text = (raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  if (text.length <= META_DESCRIPTION_MAX) return text;
  const cut = text.slice(0, META_DESCRIPTION_MAX - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 100 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Default description for a listing page, in the page's language (`listing.metaDescription`). */
export function listingMetaDescription(t: Translator, title: string, brandName: string): string {
  return t("listing.metaDescription", { title, brand: brandName });
}

/** Page metadata for the request's market, named after its brand identity. */
export async function catalogMetadata(
  input: CatalogMetadataInput,
): Promise<Metadata> {
  const { zoneCode, market } = await resolveServerCatalogMarket(input.locale);
  const brand = await loadBrandIdentityFor(input.locale, zoneCode);
  return buildCatalogMetadata(input, {
    brand,
    countryCode: "countryCode" in market ? market.countryCode : null,
    t: await getTranslator(input.locale),
  });
}

export function buildCatalogMetadata(
  input: CatalogMetadataInput,
  context: {
    brand: Pick<BrandIdentity, "name" | "names"> &
      Partial<Pick<BrandIdentity, "shareImage" | "logo">>;
    countryCode?: string | null;
    /** Wording in the page's language (default listing description). */
    t?: Translator;
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
  const otherLocales = LOCALES.filter((code) => code !== input.locale);
  const description =
    metaDescriptionText(input.description) ??
    (input.listing
      ? listingMetaDescription(context.t ?? englishTranslator, input.title, context.brand.name)
      : undefined);
  return {
    // Imported SEO titles often name the brand already ("… | Swiss Arabian UAE"):
    // the site suffix is not added a second time (any language of the name).
    title: namesBrand(input.title, context.brand.names)
      ? { absolute: input.title }
      : input.title,
    description,
    alternates,
    openGraph: {
      ...(input.ogType === "product" ? {} : { type: "website" as const }),
      title: input.title,
      description,
      url: alternates.canonical,
      siteName: context.brand.name,
      locale: openGraphLocale(input.locale, context.countryCode),
      // The same page exists in the other languages (hreflang twins for social apps).
      alternateLocale: otherLocales.map((code) => openGraphLocale(code, context.countryCode)),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description,
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
