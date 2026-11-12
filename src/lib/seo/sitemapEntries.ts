import type { MetadataRoute } from "next";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";

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
 * One sitemap entry per page and configured language, each listing every
 * language's address (hreflang) plus x-default (the default language).
 * Paths are bare (no language prefix); duplicates are listed once.
 */
export function sitemapAlternates(
  entries: ReadonlyArray<{ path: string; lastModified?: string }>,
  origin: string,
  locales: readonly string[] = LOCALES,
  defaultLocale: string = DEFAULT_LOCALE,
): MetadataRoute.Sitemap {
  const at = (url: string) => (origin ? absolute(origin, url) : url);
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, lastModified } of entries) {
    if (seen.has(path)) continue;
    seen.add(path);
    const urls = locales.map((code) => inLanguage(path, code, defaultLocale));
    const languages = origin
      ? {
          ...Object.fromEntries(locales.map((code, index) => [code, at(urls[index]!)])),
          "x-default": at(inLanguage(path, defaultLocale, defaultLocale)),
        }
      : undefined;
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
