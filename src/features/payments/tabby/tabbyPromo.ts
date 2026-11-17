import type { SiteIntegrations } from "@/lib/site/siteIntegrations.types";

/**
 * Tabby on-site messaging (product page, cart, mini cart) for every brand.
 *
 * Tabby QA (Nov 2026) asked for their official snippets instead of our own
 * "Pay in 4 / 0% interest" block: the snippet shows the plans, fees and
 * amounts Tabby really offers for that price, in the shopper's language, and
 * opens Tabby's pop-up with every required parameter (merchant code, public key).
 *
 * The keys come from this market's integrations (`paymentPromos.tabby`), which
 * is empty where checkout doesn't offer Tabby (e.g. Qatar): then nothing shows.
 */

export type TabbyPromoSource = "product" | "cart";

export type TabbyPromoConfig = {
  publicKey: string;
  merchantCode: string;
  currency: string;
  /** `https://checkout.tabby.ai` (UAE, Kuwait) or `https://checkout.tabby.sa` (KSA). */
  scriptBase: string;
};

/** Currencies Tabby's snippets cover, and the Tabby host that serves each. */
const TABBY_SCRIPT_BASE: Record<string, string> = {
  AED: "https://checkout.tabby.ai",
  KWD: "https://checkout.tabby.ai",
  SAR: "https://checkout.tabby.sa",
};

/**
 * Snippet settings for an amount in `currency`, or null when Tabby must not be
 * shown: the market has no Tabby, a key is missing, Tabby doesn't cover the
 * currency, or there is nothing to pay.
 */
export function tabbyPromoConfig(
  tabby: SiteIntegrations["paymentPromos"]["tabby"],
  amount: number,
  currency: string,
): TabbyPromoConfig | null {
  if (!tabby?.publicKey || !tabby.merchantCode) return null;
  if (!(amount > 0)) return null;
  const code = currency.trim().toUpperCase();
  const scriptBase = TABBY_SCRIPT_BASE[code];
  if (!scriptBase) return null;
  return { publicKey: tabby.publicKey, merchantCode: tabby.merchantCode, currency: code, scriptBase };
}

/** Tabby price format: decimal string in major units (KWD has 3 decimals). */
export function tabbyPromoPrice(amount: number, currency: string): string {
  return amount.toFixed(currency.toUpperCase() === "KWD" ? 3 : 2);
}
