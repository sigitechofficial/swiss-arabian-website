import { brandIntegrations } from "@/lib/brand";
import type { ShopLocale } from "@/lib/i18n/localePath";

export type InstalmentProvider = "tamara" | "tabby";

/** Pay-in-4 providers, in display order. `live`: offered at checkout today. */
export const INSTALMENT_PROVIDERS: Record<InstalmentProvider, { name: string; live: boolean }> = {
  tamara: { name: "Tamara", live: brandIntegrations().payments.tamara },
  tabby: { name: "Tabby", live: brandIntegrations().payments.tabby },
};

/** Four payments to the cent. The last one carries whatever rounding left over, so they add up to the price. */
export function payInFour(price: number): number[] {
  const cents = Math.round(price * 100);
  const each = Math.floor(cents / 4);
  return [each, each, each, cents - each * 3].map((value) => value / 100);
}

/** Currencies Tabby's own pop-up covers. Anywhere else the Tabby box keeps our dialog. */
const TABBY_CURRENCIES = new Set(["AED", "SAR", "KWD"]);

/**
 * Tabby's own "Learn more" page, the same one their snippet shows. Their docs ask custom boxes to open it
 * rather than a home-made dialog. The merchant keys are added once the account exists.
 */
export function tabbyPopupUrl(
  price: number,
  currency: string,
  locale: ShopLocale,
  keys: { publicKey: string; merchantCode: string } = brandIntegrations().tabby,
): string | null {
  const code = currency.toUpperCase();
  if (!TABBY_CURRENCIES.has(code)) return null;
  const host = code === "SAR" ? "https://checkout.tabby.sa" : "https://checkout.tabby.ai";
  const params = new URLSearchParams({ price: price.toFixed(code === "KWD" ? 3 : 2), currency: code });
  if (keys.merchantCode) params.set("merchant_code", keys.merchantCode);
  if (keys.publicKey) params.set("public_key", keys.publicKey);
  return `${host}/promos/product-page/installments/${locale}/?${params.toString()}`;
}
