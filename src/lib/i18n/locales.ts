/**
 * The shop's languages: the one place that knows which locales exist and how
 * each one is written (direction, `Intl` tag, name). Everything else asks here
 * (`isRtl`, `dir`, `intlLocale`, …) instead of comparing with a language code.
 *
 * Two lists:
 * - `LOCALES`: the languages this website can show (a message file per language in
 *   `src/messages/{locale}.json`). Addresses are read against it (`/ar/…`).
 * - Per market (`LocaleConfig`): the market's languages from the admin (Markets →
 *   languages, served by `GET /storefront/site` and the market list), limited to
 *   `LOCALES`, its default language first. That decides which languages a market
 *   website serves, which one has no URL prefix, the language picker, hreflang and
 *   the sitemap. Adding a language to a market needs no rebuild.
 *
 * When a market's languages cannot be read (backend not reachable), every language the
 * website can show is served, English first. There is no build setting for languages.
 */

/** A configured shop locale, e.g. "en" or "ar" (lowercase, as in the URL). */
export type ShopLocale = string;

/** Languages written right to left (by base language). */
const RTL_LANGUAGES = new Set([
  "ar",
  "fa",
  "ur",
  "he",
  "yi",
  "ps",
  "sd",
  "ug",
  "dv",
  "ckb",
]);

/**
 * `Intl` tags where the bare language is not the house style
 * (English dates read "13 November 2026", not "November 13, 2026").
 */
const INTL_OVERRIDES: Record<string, string> = { en: "en-GB" };

export function normalizeLocale(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Languages the website has message files for (`src/messages/*.json`; checked by
 * locales.spec). A market language outside this list is not served.
 */
export const MESSAGE_LOCALES: readonly ShopLocale[] = ["en", "ar", "fr"];

/** Every language the website can show (addresses are read against it). */
export const LOCALES: readonly ShopLocale[] = MESSAGE_LOCALES;

/**
 * The fallback language: used where no market is known (route handlers outside a
 * page tree, a message file that is missing). Pages use their market's default.
 */
export const DEFAULT_LOCALE: ShopLocale = MESSAGE_LOCALES[0]!;

/** The languages one market website serves, its default (unprefixed) language first. */
export type LocaleConfig = {
  locales: readonly ShopLocale[];
  defaultLocale: ShopLocale;
};

/**
 * Used when the market's languages cannot be read (backend not reachable, or a
 * market with none of the website's languages): every language the website can show,
 * DEFAULT_LOCALE first.
 */
export function fallbackLocaleConfig(): LocaleConfig {
  return {
    locales: [DEFAULT_LOCALE, ...MESSAGE_LOCALES.filter((c) => c !== DEFAULT_LOCALE)],
    defaultLocale: DEFAULT_LOCALE,
  };
}

/**
 * A market's languages (codes as the backend lists them, default first: "en",
 * "ar-AE", "fr-CA") → the website languages it serves. Matched by base language
 * against `LOCALES`; the market's default stays first and has no URL prefix.
 * None usable → `fallbackLocaleConfig()`.
 */
export function localeConfigFromMarket(
  languages: ReadonlyArray<string | null | undefined> | null | undefined,
): LocaleConfig {
  const locales: ShopLocale[] = [];
  for (const raw of languages ?? []) {
    const code = matchLocale(raw);
    if (code && !locales.includes(code)) locales.push(code);
  }
  if (!locales.length) return fallbackLocaleConfig();
  return { locales, defaultLocale: locales[0]! };
}

/** Whether a market website serves the language. */
export function servesLocale(config: LocaleConfig, locale: string | null | undefined): boolean {
  return typeof locale === "string" && config.locales.includes(locale);
}

/** A language the market serves for a code from anywhere ("ar-SA", "AR"); null when none. */
export function matchServedLocale(
  config: LocaleConfig,
  value: string | null | undefined,
): ShopLocale | null {
  const code = matchLocale(value);
  return code && config.locales.includes(code) ? code : null;
}

export function isLocale(value: string | null | undefined): value is ShopLocale {
  return typeof value === "string" && LOCALES.includes(value);
}

/** A configured locale, else the default. */
export function toLocale(value: string | null | undefined): ShopLocale {
  const code = normalizeLocale(value);
  return isLocale(code) ? code : DEFAULT_LOCALE;
}

/**
 * The configured locale for a language code from anywhere (an API's "ar-SA",
 * a `languageCode=AR` query), matched by base language; null when none.
 */
export function matchLocale(value: string | null | undefined): ShopLocale | null {
  const code = normalizeLocale(value);
  if (!code) return null;
  if (isLocale(code)) return code;
  const base = baseLanguage(code);
  return LOCALES.find((locale) => baseLanguage(locale) === base) ?? null;
}

/** "ar-SA" → "ar". */
export function baseLanguage(locale: string | null | undefined): string {
  return normalizeLocale(locale).split("-")[0] ?? "";
}

export function sameLanguage(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = baseLanguage(a);
  return Boolean(left) && left === baseLanguage(b);
}

export function isRtl(locale: string | null | undefined): boolean {
  return RTL_LANGUAGES.has(baseLanguage(locale));
}

export function dir(locale: string | null | undefined): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/** Tag for `Intl.*` formatters ("en" → "en-GB"). */
export function intlLocale(locale: string | null | undefined): string {
  const code = normalizeLocale(locale) || DEFAULT_LOCALE;
  return INTL_OVERRIDES[code] ?? code;
}

/** The language's own name ("English", "العربية"); the code when unknown. */
export function localeDisplayName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale);
    if (name && name.toLowerCase() !== locale.toLowerCase()) {
      return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    }
  } catch {
    // Unknown tag: fall through.
  }
  return locale.toUpperCase();
}

export type LocaleMeta = {
  code: ShopLocale;
  dir: "rtl" | "ltr";
  intl: string;
  name: string;
};

export function localeMeta(locale: ShopLocale): LocaleMeta {
  return {
    code: locale,
    dir: dir(locale),
    intl: intlLocale(locale),
    name: localeDisplayName(locale),
  };
}
