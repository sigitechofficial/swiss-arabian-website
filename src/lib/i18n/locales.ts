/**
 * The shop's languages: the one place that knows which locales exist and how
 * each one is written (direction, `Intl` tag, name). Everything else asks here
 * (`isRtl`, `dir`, `intlLocale`, …) instead of comparing with a language code.
 *
 * The list is a build-time setting so a deployment can add a language without
 * code changes:
 *
 *   NEXT_PUBLIC_SHOP_LOCALES=en,ar,fr     (the first default when unset: "en,ar")
 *   NEXT_PUBLIC_DEFAULT_LOCALE=en         (no URL prefix; others get /{locale})
 *
 * plus a message file per language in `src/messages/{locale}.json`.
 */

/** A configured shop locale, e.g. "en" or "ar" (lowercase, as in the URL). */
export type ShopLocale = string;

const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

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

/** Comma-separated locale list → validated, de-duplicated codes. */
export function parseLocaleList(raw: string | null | undefined): string[] {
  const out: string[] = [];
  for (const part of (raw ?? "").split(",")) {
    const code = normalizeLocale(part);
    if (code && LOCALE_PATTERN.test(code) && !out.includes(code)) out.push(code);
  }
  return out;
}

export function resolveLocaleConfig(
  rawLocales: string | null | undefined,
  rawDefault: string | null | undefined,
): { locales: readonly string[]; defaultLocale: string } {
  const listed = parseLocaleList(rawLocales);
  const locales = listed.length ? listed : ["en", "ar"];
  const wanted = normalizeLocale(rawDefault);
  const defaultLocale = wanted && locales.includes(wanted) ? wanted : locales[0]!;
  // The default locale comes first (sitemaps, language pickers, x-default).
  return {
    locales: [defaultLocale, ...locales.filter((code) => code !== defaultLocale)],
    defaultLocale,
  };
}

// NEXT_PUBLIC_* values must be read as static property paths to be inlined.
const CONFIG = resolveLocaleConfig(
  process.env.NEXT_PUBLIC_SHOP_LOCALES,
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
);

/** Every configured locale, default first. */
export const LOCALES: readonly ShopLocale[] = CONFIG.locales;

/** The locale served without a URL prefix. */
export const DEFAULT_LOCALE: ShopLocale = CONFIG.defaultLocale;

export function isLocale(value: string | null | undefined): value is ShopLocale {
  return typeof value === "string" && LOCALES.includes(value);
}

export function isDefaultLocale(locale: string | null | undefined): boolean {
  return locale === DEFAULT_LOCALE;
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
