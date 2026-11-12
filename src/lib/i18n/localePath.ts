import {
  DEFAULT_LOCALE,
  isDefaultLocale,
  isLocale,
  LOCALES,
  type ShopLocale,
} from "./locales";

export type { ShopLocale } from "./locales";

/** Transactional addresses stay unprefixed. Every other shop path keeps the language. */
const UNSWITCHABLE = [
  /^\/checkout(\/|$)/,
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/forgot-password(\/|$)/,
  /^\/reset-password(\/|$)/,
  /^\/verify(\/|$)/,
  /^\/order-confirmation(\/|$)/,
  /^\/track(\/|$)/,
];

/** The configured locale a path starts with ("/ar/x" → "ar"), else null. */
export function localePrefixOf(pathname: string): ShopLocale | null {
  const first = (pathname || "/").split("/")[1] ?? "";
  return isLocale(first) ? first : null;
}

/**
 * The language of an address. The default locale has no prefix; a path that
 * still carries it (the internal `/en/...` route) is the default locale too.
 */
export function localeFromPathname(pathname: string): ShopLocale {
  return localePrefixOf(pathname) ?? DEFAULT_LOCALE;
}

/** "/ar/products" → "/products"; "/ar" → "/". */
export function stripLocalePrefix(pathname: string): string {
  const prefix = localePrefixOf(pathname);
  if (!prefix) return pathname || "/";
  const rest = pathname.slice(prefix.length + 1);
  if (!rest) return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** The public address of a path in a language (default locale: no prefix). */
export function withLocalePrefix(pathname: string, locale: ShopLocale): string {
  const bare = stripLocalePrefix(pathname);
  if (isDefaultLocale(locale) || !isLocale(locale)) return bare || "/";
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** The internal route path (always prefixed, also for the default locale). */
export function internalLocalePath(pathname: string, locale: ShopLocale): string {
  const bare = stripLocalePrefix(pathname);
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

export function isLocaleSwitchablePath(pathname: string): boolean {
  const bare = stripLocalePrefix(pathname);
  return !UNSWITCHABLE.some((pattern) => pattern.test(bare));
}

/** Bare shop paths stay in constants. This adds the language prefix the customer is reading in. */
export function localizeHref(href: string, pathname: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  const withoutHash = hash ? href.slice(0, href.indexOf("#")) : href;
  const query = withoutHash.includes("?") ? withoutHash.slice(withoutHash.indexOf("?")) : "";
  const path = withoutHash.split("?")[0] || "/";
  if (localePrefixOf(path)) return href;
  if (!isLocaleSwitchablePath(path)) return href;
  return `${withLocalePrefix(path, localeFromPathname(pathname))}${query}${hash}`;
}

/**
 * Canonical and hreflang alternates for a page: one entry per configured
 * locale plus x-default (the default locale's address).
 */
export function catalogAlternates(pathname: string, locale: ShopLocale) {
  const bare = stripLocalePrefix(pathname) || "/";
  const languages: Record<string, string> = {};
  for (const code of LOCALES) languages[code] = withLocalePrefix(bare, code);
  languages["x-default"] = withLocalePrefix(bare, DEFAULT_LOCALE);
  return {
    canonical: withLocalePrefix(bare, locale),
    languages,
  };
}
