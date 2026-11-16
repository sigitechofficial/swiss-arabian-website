import { intlLocale } from "@/lib/i18n/locales";
import { formatAED } from "../../ui/shared";

/**
 * Sapil price text. English keeps the v9 look ("AED 63", "AED 19.75"); other
 * languages use Intl for the page's language and the market's currency.
 */
export function formatSapilPrice(amount: number, currency: string, locale: string): string {
  const code = (currency || "AED").toUpperCase();
  if (locale.split("-")[0] === "en") return formatAED(amount, code);
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: code,
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatAED(amount, code);
  }
}

/** A money value from the API ("63.00", 63, null) as a number, or null. */
export function parseAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}
