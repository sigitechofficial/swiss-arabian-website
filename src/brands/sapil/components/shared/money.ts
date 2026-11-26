import { formatMoney, formatMoneyParts, type MoneyFormatOptions, type MoneyParts } from "@/lib/format/money";
import { baseLanguage } from "@/lib/i18n/locales";

/**
 * Sapil's price look on top of the shared money module (`@/lib/format/money`).
 * English keeps the v9 code-first style without ".00" on whole amounts ("AED 63",
 * "AED 19.75", "KWD 10.120", "KWD 10"); every other language uses its own `Intl`
 * currency format, also without decimals on whole amounts.
 */
export function sapilMoneyOptions(locale: string): MoneyFormatOptions {
  return {
    display: baseLanguage(locale) === "en" ? "code" : "localized",
    locale,
    trimWholeAmounts: true,
  };
}

/** Sapil price text for the page's language (see `sapilMoneyOptions`); empty for a missing amount. */
export function formatSapilPrice(amount: number | string, currency: string, locale: string): string {
  return formatMoney(amount, currency, sapilMoneyOptions(locale));
}

/** Sapil price split for the grand-total row (`<small>AED</small> 105`); null for a missing amount. */
export function formatSapilPriceParts(amount: number | string, currency: string, locale: string): MoneyParts | null {
  return formatMoneyParts(amount, currency, sapilMoneyOptions(locale));
}
