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

