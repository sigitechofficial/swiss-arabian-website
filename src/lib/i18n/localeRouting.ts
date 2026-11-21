import {
  internalLocalePath,
  localeFromPathname,
  localePrefixOf,
  stripLocalePrefix,
  withLocalePrefix,
} from "./localePath";
import { matchServedLocale, servesLocale, type LocaleConfig } from "./locales";

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
 *   /fr/products           → redirect /products     when the market does not serve French
 *                                      (temporary: the market may add it later)
 *
 * Which languages and which default: the market's (`LocaleConfig`, from the admin).
 */
export type LocaleRouting =
  | { type: "next"; pathname: string; search?: string }
  | { type: "rewrite"; pathname: string; search?: string }
  | { type: "redirect"; pathname: string; search?: string; temporary?: boolean };

/** Listing addresses whose page 2+ is served by a `/p/[page]` route. */
const LISTING = /^\/(?:products|blog|collections\/[^/]+|categories\/[^/]+)$/;
const INTERNAL_PAGE = /^(\/(?:products|blog|collections\/[^/]+|categories\/[^/]+))\/p\/(\d+)$/;

export const LISTING_PAGE_SEGMENT = "p";

/** Request header with the address's language (read by app/global-not-found.tsx). */
export const SHOP_LOCALE_HEADER = "x-shop-locale";
/** Request header with the market's languages, default first ("en,ar"), for the same page. */
export const SHOP_LOCALES_HEADER = "x-shop-locales";
/**
 * Set on the proxy's own rewrites. If the server runs the proxy again on the
 * rewritten `/en/...` path (`next dev --hostname 127.0.0.1` treats the rewrite
 * as external), it must not redirect it back to `/...` (a 301 loop).
 */
export const INTERNAL_REWRITE_HEADER = "x-shop-internal-rewrite";

/** `?page=` as a whole number ≥ 1 (anything else is page 1). */
export function listingPageParam(value: string | null | undefined): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

export function isListingPath(bare: string): boolean {
  return LISTING.test(bare);
}

/**
 * The public address of a route path. Prerendered pages see their internal
 * path (`/en/products`, `/en/collections/x/p/3`); links built from it must use
 * the public one (`/products`, `/collections/x`), or every click is a 301.
 */
export function publicPathname(pathname: string, config: LocaleConfig): string {
  const locale = localeFromPathname(pathname || "/", config);
  const bare = stripLocalePrefix(pathname || "/");
  const internal = INTERNAL_PAGE.exec(bare);
  return withLocalePrefix(internal ? internal[1]! : bare, locale, config);
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
  /** The market website's languages and default (admin: Markets → languages). */
  config: LocaleConfig;
}): LocaleRouting {
  const { pathname, searchParams, config } = input;
  const prefix = localePrefixOf(pathname);
  const bare = stripLocalePrefix(pathname);

  // A language the website knows but this market does not serve: the same page in
  // the market's default language. Temporary, as the market may add the language.
  if (prefix && !servesLocale(config, prefix)) {
    return { type: "redirect", pathname: bare, search: searchWith(searchParams, {}), temporary: true };
  }
  const locale = prefix ?? config.defaultLocale;

  const internal = INTERNAL_PAGE.exec(bare);
  if (internal) {
    return {
      type: "redirect",
      pathname: withLocalePrefix(internal[1]!, locale, config),
      search: searchWith(searchParams, { page: internal[2]! }),
    };
  }

  if (prefix === config.defaultLocale) {
    return { type: "redirect", pathname: bare };
  }

  if (!prefix && input.switchable) {
    const wanted = matchServedLocale(config, searchParams.get("languageCode"));
    if (wanted && wanted !== config.defaultLocale) {
      return {
        type: "redirect",
        pathname: withLocalePrefix(bare, wanted, config),
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
    // Payment providers send the shopper back to fixed, unprefixed addresses
    // (`/payments/tabby/return`). Our return links carry the checkout language
    // as `?lang=`, so the page is served in that language while the address
    // stays the one agreed with the backend (Tabby QA, Nov 2026: Arabic shoppers
    // must read Tabby's Arabic messages).
    const returnLocale = input.switchable ? null : matchServedLocale(config, searchParams.get("lang"));
    return { type: "rewrite", pathname: internalLocalePath(bare, returnLocale ?? config.defaultLocale) };
  }
  return { type: "next", pathname };
}
