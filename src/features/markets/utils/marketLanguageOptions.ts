import {
  localeDisplayName,
  matchLocale,
  type LocaleConfig,
  type ShopLocale,
} from "@/lib/i18n/locales";
import type { StorefrontMarketLanguage } from "../types/market";

export type LanguageOption = { id: ShopLocale; label: string; lang: ShopLocale };

function option(code: ShopLocale, displayName?: string | null): LanguageOption {
  const native = localeDisplayName(code);
  // The language's own name ("العربية"); the market's name only when the browser has none.
  const label = native !== code.toUpperCase() ? native : displayName?.trim() || native;
  return { id: code, label, lang: code };
}

/** The page market's languages (the picker before the market list is read). */
export function configuredLanguageOptions(config: LocaleConfig): LanguageOption[] {
  return config.locales.map((code) => option(code));
}

/**
 * The language picker for a market: the market's languages (admin: Markets →
 * languages) that the website can show, its default first. The page's own language
 * is always listed; with no usable market languages, the page market's languages.
 */
export function marketLanguageOptions(
  languages: readonly StorefrontMarketLanguage[] | null | undefined,
  current: ShopLocale | null | undefined,
  config: LocaleConfig,
): LanguageOption[] {
  const out: LanguageOption[] = [];
  const ordered = [...(languages ?? [])].sort(
    (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)),
  );
  for (const language of ordered) {
    const code = matchLocale(language.locale || language.languageCode);
    if (!code || out.some((entry) => entry.id === code)) continue;
    out.push(option(code, language.displayName));
  }
  if (!out.length) return configuredLanguageOptions(config);
  if (current && !out.some((entry) => entry.id === current)) out.push(option(current));
  return out;
}
