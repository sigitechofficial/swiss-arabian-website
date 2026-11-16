"use client";

import { useMemo } from "react";
import { useMarket } from "@/providers/MarketProvider";
import type { StorefrontMarket } from "../types/market";
import { useStorefrontMarkets } from "./useStorefrontMarkets";

/** Shop-facing facts of the selected market, from the markets API. Nothing is invented here. */
export type MarketSettings = {
  zoneCode: string | null;
  currencyCode: string | null;
  /** Lowest order total that ships free; null when the market has none (or the API doesn't say). */
  freeDeliveryThreshold: number | null;
  /** Cash on delivery offered; null when the API doesn't say. */
  cashOnDelivery: boolean | null;
  /** "Under X" price edits, ascending; empty when the API doesn't send them. */
  priceEditTiers: number[];
};

const EMPTY: MarketSettings = {
  zoneCode: null,
  currencyCode: null,
  freeDeliveryThreshold: null,
  cashOnDelivery: null,
  priceEditTiers: [],
};

function positive(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return value != null && value !== "" && Number.isFinite(n) && n > 0 ? n : null;
}

export function marketSettingsOf(market: StorefrontMarket | null | undefined): MarketSettings {
  if (!market) return EMPTY;
  const delivery = market.delivery;
  const tiers = Array.isArray(market.priceEditTiers)
    ? [...new Set(market.priceEditTiers.map(positive).filter((n): n is number => n != null))].sort((a, b) => a - b)
    : [];
  return {
    zoneCode: market.zoneCode,
    currencyCode: delivery?.currencyCode || market.defaultCurrencyCode || market.catalogContext?.currencyCode || null,
    freeDeliveryThreshold: positive(delivery?.freeDeliveryThreshold),
    cashOnDelivery: delivery?.cashOnDelivery ? Boolean(delivery.cashOnDelivery.available) : null,
    priceEditTiers: tiers,
  };
}

/** Settings of the market the shopper selected (free delivery, cash on delivery, price edits). */
export function useMarketSettings(): MarketSettings {
  const { marketId } = useMarket();
  const { data } = useStorefrontMarkets();
  return useMemo(
    () => marketSettingsOf(data?.markets?.find((m) => m.zoneCode === marketId) ?? null),
    [data, marketId],
  );
}
