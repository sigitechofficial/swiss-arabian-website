"use client";

import { parseMoney, roundMoney } from "@/lib/format/money";
import { useMarket } from "@/providers/MarketProvider";
import type { StorefrontMarketDelivery } from "../types/market";
import { useStorefrontMarkets } from "./useStorefrontMarkets";

/**
 * The selected market's delivery promises from `GET /storefront/markets`
 * (free-delivery threshold, standard / express, cash on delivery). Display
 * only: checkout's delivery and payment methods stay the authority.
 */
export function useMarketDelivery(): {
  delivery: StorefrontMarketDelivery | null;
  freeDeliveryThreshold: number | null;
  currency: string | null;
  cashOnDelivery: boolean;
} {
  const { marketId } = useMarket();
  const { data } = useStorefrontMarkets();
  const zone = marketId?.trim().toUpperCase() ?? "";
  const market =
    (zone ? data?.markets.find((m) => m.zoneCode.toUpperCase() === zone) : data?.defaultMarket) ?? null;
  const delivery = market?.delivery ?? null;
  return {
    delivery,
    freeDeliveryThreshold: parseMoney(delivery?.freeDeliveryThreshold),
    currency: delivery?.currencyCode ?? market?.defaultCurrencyCode ?? null,
    cashOnDelivery: Boolean(delivery?.cashOnDelivery?.available),
  };
}

/** Progress towards a free-delivery threshold for a bag subtotal (progress 0–1). */
export function freeDeliveryProgress(threshold: number | null, subtotal: number, currency: string) {
  if (threshold == null || !(threshold > 0)) return null;
  return {
    threshold,
    progress: Math.min(1, Math.max(0, subtotal / threshold)),
    remaining: Math.max(0, roundMoney(threshold - subtotal, currency)),
    reached: subtotal >= threshold,
  };
}
