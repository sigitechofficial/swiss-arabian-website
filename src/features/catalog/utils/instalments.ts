import type { ShopLocale } from "@/lib/i18n/localePath";
import type { SiteIntegrations } from "@/lib/site/siteIntegrations.types";

export type InstalmentProvider = "tamara" | "tabby";

/** Pay-in-4 providers, in display order. */
export const INSTALMENT_PROVIDER_NAMES: Record<InstalmentProvider, string> = {
  tamara: "Tamara",
  tabby: "Tabby",
};

/**
 * Pay-in-4 providers for this website. `live`: the market's checkout offers it
 * now (the backend's answer for the address, ADR-005 phase E).
 */
export function instalmentProviders(
  promos: SiteIntegrations["paymentPromos"],
): Record<InstalmentProvider, { name: string; live: boolean }> {
  return {
    tamara: { name: INSTALMENT_PROVIDER_NAMES.tamara, live: Boolean(promos.tamara) },
    tabby: { name: INSTALMENT_PROVIDER_NAMES.tabby, live: Boolean(promos.tabby) },
  };
}

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
  keys: { publicKey: string | null; merchantCode: string | null } | null,
): string | null {
  const code = currency.toUpperCase();
  if (!TABBY_CURRENCIES.has(code)) return null;
  const host = code === "SAR" ? "https://checkout.tabby.sa" : "https://checkout.tabby.ai";
  const params = new URLSearchParams({ price: price.toFixed(code === "KWD" ? 3 : 2), currency: code });
  if (keys?.merchantCode) params.set("merchant_code", keys.merchantCode);
  if (keys?.publicKey) params.set("public_key", keys.publicKey);
  return `${host}/promos/product-page/installments/${locale}/?${params.toString()}`;
}
