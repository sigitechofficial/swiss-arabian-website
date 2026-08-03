"use client";

import { useMarket } from "@/providers/MarketProvider";

/** Hook wrapper for market selection — expand with markets list API later. */
export function useSelectedMarket() {
  return useMarket();
}
