"use client";

import { useMarket } from "@/providers/MarketProvider";
import type { StorefrontMarketDelivery } from "../types/market";
import { useStorefrontMarkets } from "./useStorefrontMarkets";

function amount(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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
    freeDeliveryThreshold: amount(delivery?.freeDeliveryThreshold),
    currency: delivery?.currencyCode ?? market?.defaultCurrencyCode ?? null,
    cashOnDelivery: Boolean(delivery?.cashOnDelivery?.available),
  };
}

/** Progress towards a free-delivery threshold for a bag subtotal (progress 0–1). */
export function freeDeliveryProgress(threshold: number | null, subtotal: number) {
  if (threshold == null || !(threshold > 0)) return null;
  return {
    threshold,
    progress: Math.min(1, Math.max(0, subtotal / threshold)),
    remaining: Math.max(0, Math.round((threshold - subtotal) * 100) / 100),
    reached: subtotal >= threshold,
  };
}
