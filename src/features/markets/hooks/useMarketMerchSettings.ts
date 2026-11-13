"use client";

import { useMemo } from "react";
import { useMarket } from "@/providers/MarketProvider";
import { readMarketMerchSettings, type MarketMerchSettings } from "../utils/marketMerchSettings";
import { useStorefrontMarkets } from "./useStorefrontMarkets";

/**
 * Price-edit tiers and delivery / cash-on-delivery promises of the shopper's
 * market (`GET /storefront/markets`, cached 5 min). Defaults (tiers 50/99/199,
 * no delivery promise) until the list has loaded or when the API omits them.
 */
export function useMarketMerchSettings(): MarketMerchSettings & { isLoading: boolean } {
  const { marketId } = useMarket();
  const { data, isLoading } = useStorefrontMarkets();
  return useMemo(() => {
    const zone = marketId?.trim();
    const market =
      data?.markets.find((m) => m.zoneCode === zone) ?? data?.defaultMarket ?? null;
    return { ...readMarketMerchSettings(market), isLoading };
  }, [data, isLoading, marketId]);
}
