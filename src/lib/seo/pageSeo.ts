import { cache } from "react";
import type { Metadata } from "next";
import { apiGet } from "@/lib/api/apiClient";
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

/** Published SEO for a page, or null when the admin has not published any. Cached per request. */
export const loadPublishedPageSeo = cache(async (path: string) => {
  const resolved = await resolveServerCatalogMarket();
  if (!resolved.zoneCode) return { locale: resolved.locale, seo: null };
  try {
    // The endpoint accepts path, locale and zoneCode only (extra fields are rejected).
    const qs = new URLSearchParams({ path, locale: resolved.locale, zoneCode: resolved.zoneCode });
    // The endpoint answers { data: { path, seo } } inside the usual envelope.
    const data = await apiGet<{ seo?: PublishedPageSeo; data?: { seo?: PublishedPageSeo } }>(
      `/storefront/catalog/page-seo?${qs.toString()}`,
      { skipAuth: true },
    );
    return { locale: resolved.locale, seo: data.data?.seo ?? data.seo ?? null };
  } catch {
    // 404 = nothing published: the page keeps its own defaults.
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
  /** Path without the /ar prefix, e.g. "/" or "/collections". */
  path: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  /** A product listing: gets a default description when none is set (see `catalogMetadata`). */
  listing?: boolean;
}): Promise<Metadata> {
  const { locale, seo } = await loadPublishedPageSeo(input.path);
  const fallbackTitle =
    locale === "ar" && input.titleAr ? input.titleAr : input.title;
  const fallbackDescription =
    locale === "ar" && input.descriptionAr
      ? input.descriptionAr
      : input.description;
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
