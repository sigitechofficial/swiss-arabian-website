import type { StorefrontShippingPromise } from "@/features/catalog/types/pdpShipping";
import type { MarketDelivery } from "@/features/markets/utils/marketMerchSettings";

export type DeliveryPerk =
  | { kind: "free"; threshold: number }
  | { kind: "days"; min: number; max: number }
  | { kind: "cod" };

function amount(value: string | null | undefined): number | null {
  const n = value == null ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The product page's delivery notes, from data only: the product's delivery
 * promise (this market's default method), else the market's delivery settings;
 * "pay on delivery" only when the market offers cash on delivery.
 */
export function deliveryPerks(
  promise: StorefrontShippingPromise | null | undefined,
  market: MarketDelivery | null | undefined,
): DeliveryPerk[] {
  const perks: DeliveryPerk[] = [];
  const threshold = amount(promise?.freeDeliveryThreshold) ?? amount(market?.freeDeliveryThreshold);
  if (threshold != null) perks.push({ kind: "free", threshold });
  const min = promise?.estimatedMinDays ?? market?.standard?.estimatedMinDays ?? null;
  const max = promise?.estimatedMaxDays ?? market?.standard?.estimatedMaxDays ?? null;
  if (min != null || max != null) perks.push({ kind: "days", min: min ?? (max as number), max: max ?? (min as number) });
  if (market?.cashOnDelivery.available) perks.push({ kind: "cod" });
  return perks;
}
