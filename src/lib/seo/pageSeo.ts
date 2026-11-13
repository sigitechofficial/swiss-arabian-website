import { cache } from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env";
import { resolveStorefrontHost } from "@/lib/api/storefrontHost";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  catalogMetadata,
  resolveServerCatalogMarket,
} from "@/lib/seo/catalogPage";

/** SEO the admin published for one site page (SEO Management), for this market. */
export type PublishedPageSeo = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Array<Record<string, unknown>>;
};

/** Same as the ISR pages that read it: a record (or "no record") is reused for 5 minutes. */
export const PAGE_SEO_REVALIDATE_SECONDS = 300;

/**
 * Whether a path can have a pages-SEO record. Products, collections and
 * categories carry their SEO in the catalog API (the backend answers 404
 * "Product SEO is served by the catalog product API" for `/products…`), so
 * they are never asked for.
 */
export function canHavePageSeoRecord(path: string): boolean {
  const clean = path.trim().split(/[?#]/)[0] ?? "";
  if (!clean.startsWith("/")) return false;
  if (/^\/products(\/|$)/i.test(clean)) return false;
  if (/^\/(collections|categories)\/[^/]+/i.test(clean)) return false;
  return true;
}

type PageSeoEnvelope = { data?: { seo?: PublishedPageSeo } | null; seo?: PublishedPageSeo };

/**
 * One page-seo lookup, cached across requests. A 404 is cached as "no record"
 * for as long as a found record, so a page without admin SEO does not ask
 * again on every render. Network errors and 5xx are thrown, so they are never
 * cached (the caller falls back to the page's own defaults for that render).
 */
const fetchPageSeoRecord = unstable_cache(
  async (path: string, locale: string, zoneCode: string, host: string | null): Promise<PublishedPageSeo | null> => {
    // The endpoint accepts path, locale and zoneCode only (extra fields are rejected).
    const qs = new URLSearchParams({ path, locale, zoneCode });
    const headers: Record<string, string> = {};
    if (host) headers["x-storefront-host"] = host;
    const res = await fetch(`${env.apiBaseUrl}/storefront/catalog/page-seo?${qs.toString()}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`page-seo ${res.status}`);
    // The endpoint answers { data: { path, seo } } inside the usual envelope.
    const json = (await res.json()) as { data?: PageSeoEnvelope } & PageSeoEnvelope;
    return json.data?.data?.seo ?? json.data?.seo ?? json.seo ?? null;
  },
  ["storefront-page-seo"],
  { revalidate: PAGE_SEO_REVALIDATE_SECONDS },
);

/**
 * Published SEO for a page, or null when the admin has not published any.
 * Server metadata only (generateMetadata / server pages); cached per request
 * and across requests.
 */
export const loadPublishedPageSeo = cache(async (path: string) => {
  const resolved = await resolveServerCatalogMarket();
  if (!resolved.zoneCode || !canHavePageSeoRecord(path)) {
    return { locale: resolved.locale, seo: null };
  }
  try {
    // Read outside the cache scope: the storefront host may come from the request.
    const host = await resolveStorefrontHost();
    const seo = await fetchPageSeoRecord(path, resolved.locale, resolved.zoneCode, host);
    return { locale: resolved.locale, seo };
  } catch {
    // API unreachable: the page keeps its own defaults for this render.
    return { locale: resolved.locale, seo: null };
  }
});

/** robots text from the admin ("noindex, follow") → metadata; null when it allows indexing. */
export function robotsFromText(
  text?: string | null,
): Metadata["robots"] | null {
  const value = text?.toLowerCase() ?? "";
  const noindex = value.includes("noindex");
  const nofollow = value.includes("nofollow");
  if (!noindex && !nofollow) return null;
  return { index: !noindex, follow: !nofollow };
}

/**
 * Metadata for a fixed site page (home, collections list, blog, FAQ …).
 * Admin SEO Management wins; the page's own title and description are the fallback.
 * Canonical and hreflang always point at this market's own address.
 * The site-wide "do not index" switch (root layout) still applies: a page can
 * ask for noindex, never force indexing.
 */
export async function pageMetadata(input: {
  /** Path without a language prefix, e.g. "/" or "/collections". */
  path: string;
  /** In the page's language (callers use the route's translator). */
  title: string;
  description?: string;
  /** A product listing: gets a default description when none is set (see `catalogMetadata`). */
  listing?: boolean;
}): Promise<Metadata> {
  const { locale, seo } = await loadPublishedPageSeo(input.path);
  const fallbackTitle = input.title;
  const fallbackDescription = input.description;
  const base = await catalogMetadata({
    locale,
    path: withLocalePrefix(input.path, locale),
    title: seo?.title || fallbackTitle,
    description: seo?.description || fallbackDescription,
    image: seo?.ogImage || null,
    listing: input.listing,
  });
  return applySeoOverrides(base, seo);
}

/** Admin SEO fields that change the page head (pages SEO and product SEO share them). */
export type SeoOverrideFields = Pick<
  PublishedPageSeo,
  | "canonicalUrl"
  | "robots"
  | "ogTitle"
  | "ogDescription"
  | "ogImage"
  | "ogImageAlt"
  | "twitterTitle"
  | "twitterDescription"
  | "twitterImage"
>;

/**
 * Admin values win over the page defaults. Robots can only tighten: the
 * site-wide "do not index" switch (root layout) still applies when it is off.
 */
export function applySeoOverrides(
  base: Metadata,
  seo: SeoOverrideFields | null | undefined,
): Metadata {
  if (!seo) return base;
  const robots = robotsFromText(seo.robots);
  const image = seo.twitterImage || seo.ogImage;
  return {
    ...base,
    ...(seo.canonicalUrl
      ? { alternates: { ...base.alternates, canonical: seo.canonicalUrl } }
      : {}),
    ...(robots ? { robots } : {}),
    openGraph: {
      ...base.openGraph,
      ...(seo.ogTitle ? { title: seo.ogTitle } : {}),
      ...(seo.ogDescription ? { description: seo.ogDescription } : {}),
      ...(seo.ogImage
        ? { images: [{ url: seo.ogImage, alt: seo.ogImageAlt }] }
        : {}),
    },
    twitter: {
      ...base.twitter,
      ...(seo.twitterTitle ? { title: seo.twitterTitle } : {}),
      ...(seo.twitterDescription
        ? { description: seo.twitterDescription }
        : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Structured data the admin published for the page (empty when none). */
export async function pageJsonLd(path: string) {
  const { seo } = await loadPublishedPageSeo(path);
  return seo?.jsonLd ?? [];
}
