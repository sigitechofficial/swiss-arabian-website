"use client";

import { useMarket } from "@/providers/MarketProvider";
import { useReturnsPolicy } from "./useAfterSales";

/**
 * `/return-terms` data for every brand: the selected market's name and its
 * return, exchange and cancellation terms today (from its after-sales settings).
 */
export function useMarketReturnTerms() {
  const { marketId, regionOptions } = useMarket();
  const zoneCode = marketId ?? "";
  const market = regionOptions.find((option) => option.id === marketId)?.label ?? zoneCode;
  const policy = useReturnsPolicy({ mode: "market", zoneCode });
  return { market, policy };
}
