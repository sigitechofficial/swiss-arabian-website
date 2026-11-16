"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/apiClient";
import { useMarket } from "@/providers/MarketProvider";

/**
 * Tabby on-site messaging (product page, cart, mini cart).
 *
 * Tabby QA (Nov 2026) asked for their official snippets instead of our own
 * "Pay in 4 / 0% interest" block: the snippet always shows the plans, fees
 * and amounts Tabby really offers for that price, in the shopper's language,
 * and opens Tabby's pop-up with every required parameter.
 *
 * Settings come from the backend per market (`/storefront/markets/:zone/tabby-promo`),
 * which only says `available` where checkout offers Tabby. Elsewhere (Qatar)
 * nothing Tabby is shown.
 */

export type TabbyPromoConfig =
  | { available: false }
  | {
      available: true;
      publicKey: string;
      merchantCode: string;
      currency: string;
      /** `https://checkout.tabby.ai` (UAE) or `https://checkout.tabby.sa` (KSA). */
      snippetScriptBase: string;
    };

export type TabbyPromoSource = "product" | "cart";

export function fetchTabbyPromoConfig(zoneCode: string): Promise<TabbyPromoConfig> {
  return apiGet<TabbyPromoConfig>(
    `/storefront/markets/${encodeURIComponent(zoneCode)}/tabby-promo`,
    { skipAuth: true },
  );
}

function isTabbyScriptHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /(^|\.)tabby\.(ai|sa)$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Settings to use for an amount in `currency`, or null when Tabby must not
 * be shown (market without Tabby, other currency, bad script host, no amount).
 */
export function usableTabbyPromo(
  config: TabbyPromoConfig | null | undefined,
  amount: number,
  currency: string,
): Extract<TabbyPromoConfig, { available: true }> | null {
  if (!config || !config.available) return null;
  if (!(amount > 0)) return null;
  if (config.currency.toUpperCase() !== currency.trim().toUpperCase()) return null;
  if (!config.publicKey || !config.merchantCode) return null;
  if (!isTabbyScriptHost(config.snippetScriptBase)) return null;
  return config;
}

/** The selected market's Tabby promo settings (cached; null while loading). */
export function useTabbyPromoConfig(): TabbyPromoConfig | null {
  const { marketId } = useMarket();
  const zoneCode = marketId?.trim() || "";
  const query = useQuery({
    queryKey: ["tabby-promo", zoneCode],
    queryFn: () => fetchTabbyPromoConfig(zoneCode),
    enabled: Boolean(zoneCode),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  return query.data ?? null;
}
