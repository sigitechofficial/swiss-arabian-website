import {
  LOCALES,
  localeDisplayName,
  matchLocale,
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

/** Every configured shop language (the picker before the market is known). */
export function configuredLanguageOptions(): LanguageOption[] {
  return LOCALES.map((code) => option(code));
}

/**
 * The language picker for a market: the market's languages (Zone languages)
 * that the shop is configured for, in the configured order. The page's own language is
 * always listed; with no usable market languages, every configured language.
 */
export function marketLanguageOptions(
  languages: readonly StorefrontMarketLanguage[] | null | undefined,
  current?: ShopLocale | null,
): LanguageOption[] {
  const out: LanguageOption[] = [];
  for (const language of languages ?? []) {
    const code = matchLocale(language.locale || language.languageCode);
    if (!code || out.some((entry) => entry.id === code)) continue;
    out.push(option(code, language.displayName));
  }
  if (!out.length) return configuredLanguageOptions();
  if (current && !out.some((entry) => entry.id === current)) out.push(option(current));
  // Keep the configured order (default language first) for a stable picker.
  return out.sort((a, b) => LOCALES.indexOf(a.id) - LOCALES.indexOf(b.id));
}
