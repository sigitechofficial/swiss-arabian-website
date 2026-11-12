import {
  internalLocalePath,
  localePrefixOf,
  stripLocalePrefix,
  withLocalePrefix,
} from "./localePath";
import { DEFAULT_LOCALE, matchLocale } from "./locales";

/**
 * How the proxy maps a public address onto the `[locale]` route tree.
 *
 *   /products              → rewrite  /en/products          (default locale, no prefix)
 *   /ar/products           → next     (matches [locale]=ar)
 *   /en/products           → redirect /products             (one address per page)
 *   /products?languageCode=ar → redirect /ar/products        (old Shopify-style links)
 *   /collections/x?page=3  → rewrite  /en/collections/x/p/3 (listing page N is its own
 *                                      static page; the address keeps ?page=3)
 *   /collections/x/p/3     → redirect /collections/x?page=3 (internal shape is not public)
 */
export type LocaleRouting =
  | { type: "next"; pathname: string; search?: string }
  | { type: "rewrite"; pathname: string; search?: string }
  | { type: "redirect"; pathname: string; search?: string };

/** Listing addresses whose page 2+ is served by a `/p/[page]` route. */
const LISTING = /^\/(?:products|collections\/[^/]+|categories\/[^/]+)$/;
const INTERNAL_PAGE = /^(\/(?:products|collections\/[^/]+|categories\/[^/]+))\/p\/(\d+)$/;

export const LISTING_PAGE_SEGMENT = "p";

/** `?page=` as a whole number ≥ 1 (anything else is page 1). */
export function listingPageParam(value: string | null | undefined): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

export function isListingPath(bare: string): boolean {
  return LISTING.test(bare);
}

function searchWith(params: URLSearchParams, changes: Record<string, string | null>): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const text = next.toString();
  return text ? `?${text}` : "";
}

export function localeRouting(input: {
  pathname: string;
  searchParams: URLSearchParams;
  /** False for transactional addresses (checkout, sign in…), which stay unprefixed. */
  switchable: boolean;
}): LocaleRouting {
  const { pathname, searchParams } = input;
  const prefix = localePrefixOf(pathname);
  const locale = prefix ?? DEFAULT_LOCALE;
  const bare = stripLocalePrefix(pathname);

  const internal = INTERNAL_PAGE.exec(bare);
  if (internal) {
    return {
      type: "redirect",
      pathname: withLocalePrefix(internal[1]!, locale),
      search: searchWith(searchParams, { page: internal[2]! }),
    };
  }

  if (prefix === DEFAULT_LOCALE) {
    return { type: "redirect", pathname: bare };
  }

  if (!prefix && input.switchable) {
    const wanted = matchLocale(searchParams.get("languageCode"));
    if (wanted && wanted !== DEFAULT_LOCALE) {
      return {
        type: "redirect",
        pathname: withLocalePrefix(bare, wanted),
        search: searchWith(searchParams, { languageCode: null }),
      };
    }
  }

  const page = listingPageParam(searchParams.get("page"));
  if (page > 1 && isListingPath(bare)) {
    return {
      type: "rewrite",
      pathname: internalLocalePath(`${bare}/${LISTING_PAGE_SEGMENT}/${page}`, locale),
    };
  }

  if (!prefix) {
    return { type: "rewrite", pathname: internalLocalePath(bare, DEFAULT_LOCALE) };
  }
  return { type: "next", pathname };
}
