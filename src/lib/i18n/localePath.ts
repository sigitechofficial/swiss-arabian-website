import { isLocale, type LocaleConfig, type ShopLocale } from "./locales";
import { activeLocaleConfig } from "./activeLocaleConfig";
import { marketPrefixOf, withoutMarketSegment } from "@/lib/site/marketLink";

export type { LocaleConfig, ShopLocale } from "./locales";

/**
 * Addresses that stay unprefixed: the payment providers' browser returns, whose
 * paths are fixed with the backend (`/payments/tabby/return`, `/payments/telr/return`).
 * Every other shop path keeps the language, checkout and sign-in included
 * (their `[locale]` routes exist), so an Arabic shopper stays in Arabic.
 */
const UNSWITCHABLE = [/^\/payments(\/|$)/];

/**
 * The language a path starts with ("/ar/x" → "ar"), else null. Read against every
 * language the website can show, so the same address means the same on every
 * market (whether that market serves it is the proxy's decision).
 */
export function localePrefixOf(pathname: string): ShopLocale | null {
  // A market on the shared address (`/~KWT/ar/x`): the language follows its segment.
  const first = withoutMarketSegment(pathname || "/").split("/")[1] ?? "";
  return isLocale(first) ? first : null;
}

/**
 * The language of an address on a market website: its prefix, else the market's
 * default language (which has no prefix). The internal route (`/en/...`) carries
 * the default's prefix too.
 */
export function localeFromPathname(pathname: string, config: LocaleConfig): ShopLocale {
  return localePrefixOf(pathname) ?? config.defaultLocale;
}

/** "/ar/products" → "/products"; "/ar" → "/"; a market segment goes too ("/~KWT/ar/x" → "/x"). */
export function stripLocalePrefix(pathname: string): string {
  const path = withoutMarketSegment(pathname || "/");
  const prefix = localePrefixOf(path);
  if (!prefix) return path || "/";
  const rest = path.slice(prefix.length + 1);
  if (!rest) return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** The public address of a path in a language (the market's default language: no prefix). */
export function withLocalePrefix(pathname: string, locale: ShopLocale, config: LocaleConfig): string {
  const bare = stripLocalePrefix(pathname);
  if (locale === config.defaultLocale || !isLocale(locale)) return bare || "/";
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

/**
 * Bare shop paths stay in constants. This adds the language prefix the customer is
 * reading in. Pass the market's languages (`useLocaleConfig()` / server config);
 * without them (browser event handlers only) the page's own market languages are used.
 */
export function localizeHref(href: string, pathname: string, config?: LocaleConfig): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  // Already a market's address on the shared address: as given.
  if (marketPrefixOf(href.split(/[?#]/)[0] || "/")) return href;
  // A page of a market on the shared address (`/~KWT/…`) keeps its market segment.
  const market = marketPrefixOf(pathname);
  const inMarket = (value: string) => (market ? `${market}${value === "/" ? "" : value}` : value);
  const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
  const withoutHash = hash ? href.slice(0, href.indexOf("#")) : href;
  const query = withoutHash.includes("?") ? withoutHash.slice(withoutHash.indexOf("?")) : "";
  const path = withoutHash.split("?")[0] || "/";
  if (localePrefixOf(path) || !isLocaleSwitchablePath(path)) return `${inMarket(path)}${query}${hash}`;
  const languages = config ?? activeLocaleConfig();
  if (!languages) {
    // No market languages known (server code that passed none): keep the
    // address's own prefix, which is never the default language's.
    const prefix = localePrefixOf(pathname);
    return `${inMarket(prefix ? internalLocalePath(path, prefix) : path)}${query}${hash}`;
  }
  return `${inMarket(withLocalePrefix(path, localeFromPathname(pathname, languages), languages))}${query}${hash}`;
}

/**
 * Canonical and hreflang alternates for a page: one entry per language the
 * market serves plus x-default (the market's default language).
 */
export function catalogAlternates(pathname: string, locale: ShopLocale, config: LocaleConfig) {
  const bare = stripLocalePrefix(pathname) || "/";
  const languages: Record<string, string> = {};
  for (const code of config.locales) languages[code] = withLocalePrefix(bare, code, config);
  languages["x-default"] = withLocalePrefix(bare, config.defaultLocale, config);
  return {
    canonical: withLocalePrefix(bare, locale, config),
    languages,
  };
}
