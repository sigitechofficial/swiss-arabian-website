import type { MetadataRoute } from "next";
import { stripLocalePrefix } from "@/lib/i18n/localePath";

/** A bare path in a language: the default has no prefix. */
function inLanguage(path: string, code: string, defaultLocale: string): string {
  const bare = stripLocalePrefix(path) || "/";
  if (code === defaultLocale) return bare;
  return bare === "/" ? `/${code}` : `/${code}${bare}`;
}

function absolute(origin: string, path: string) {
  return `${origin}${path === "/" ? "" : path}`;
}

/**
 * One sitemap entry per page and language the market serves, each listing every
 * language's address (hreflang) plus x-default (the default language).
 * Paths are bare (no language prefix); duplicates are listed once.
 */
export function sitemapAlternates(
  entries: ReadonlyArray<{ path: string; lastModified?: string }>,
  origin: string,
  /** The market's languages, default first (admin: Markets → languages). */
  locales: readonly string[],
  defaultLocale: string,
  /**
   * hreflang for a page across market websites (absolute addresses), or null to
   * list this website's languages only.
   */
  crossMarket?: (path: string) => Record<string, string> | null,
): MetadataRoute.Sitemap {
  const at = (url: string) => (origin ? absolute(origin, url) : url);
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, lastModified } of entries) {
    if (seen.has(path)) continue;
    seen.add(path);
    const urls = locales.map((code) => inLanguage(path, code, defaultLocale));
    const languages = crossMarket?.(path) ?? (origin
      ? {
          ...Object.fromEntries(locales.map((code, index) => [code, at(urls[index]!)])),
          "x-default": at(inLanguage(path, defaultLocale, defaultLocale)),
        }
      : undefined);
    for (const url of urls) {
      out.push({
        url: at(url),
        ...(lastModified ? { lastModified } : {}),
        alternates: languages ? { languages } : undefined,
      });
    }
  }
  return out;
}
