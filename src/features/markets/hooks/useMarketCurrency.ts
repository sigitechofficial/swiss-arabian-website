import { useOptionalMarket } from "@/providers/MarketProvider";

/**
 * The selected market's currency: the fallback for amounts whose data comes
 * without a currency. Outside a market (shared widgets, tests) it is AED, the
 * default market's currency.
 */
export function useMarketCurrency(): string {
  return useOptionalMarket()?.catalogContext?.currencyCode?.trim() || "AED";
}
