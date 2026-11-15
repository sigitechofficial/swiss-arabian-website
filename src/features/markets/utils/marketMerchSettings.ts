/**
 * Market-wide merchandising settings from `GET /storefront/markets` (per market):
 * the "Under <currency> X" price-edit tiers and the delivery / cash-on-delivery
 * promises. Read defensively: older APIs send neither field.
 */

/** Default price-edit ceilings when the market has none (backend default too). */
export const DEFAULT_PRICE_EDIT_TIERS: readonly number[] = [50, 99, 199];

export type MarketDeliveryPromise = {
  methodCode: string;
  methodType: string;
  displayName: string;
  fee: string | null;
  freeDeliveryThreshold: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
};

export type MarketDelivery = {
  currencyCode: string | null;
  /** Lowest free-delivery threshold of the market's methods; null = none. */
  freeDeliveryThreshold: string | null;
  standard: MarketDeliveryPromise | null;
  express: MarketDeliveryPromise | null;
  cashOnDelivery: {
    available: boolean;
    minOrderAmount: string | null;
    maxOrderAmount: string | null;
    fee: string | null;
  };
};

export type MarketMerchSettings = {
  priceEditTiers: number[];
  delivery: MarketDelivery | null;
};

function text(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function int(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : null;
}

/** Ascending, unique, positive prices; the default list when none are usable. */
export function readPriceEditTiers(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [...DEFAULT_PRICE_EDIT_TIERS];
  const tiers = [
    ...new Set(
      raw
        .map((v) => (typeof v === "string" ? Number(v) : v))
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0),
    ),
  ].sort((a, b) => a - b);
  return tiers.length ? tiers : [...DEFAULT_PRICE_EDIT_TIERS];
}

function readPromise(raw: unknown): MarketDeliveryPromise | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const methodCode = text(row.methodCode);
  if (!methodCode) return null;
  return {
    methodCode,
    methodType: text(row.methodType) ?? "",
    displayName: text(row.displayName) ?? methodCode,
    fee: text(row.fee),
    freeDeliveryThreshold: text(row.freeDeliveryThreshold),
    estimatedMinDays: int(row.estimatedMinDays),
    estimatedMaxDays: int(row.estimatedMaxDays),
  };
}

export function readMarketDelivery(raw: unknown): MarketDelivery | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const cod = (row.cashOnDelivery && typeof row.cashOnDelivery === "object"
    ? row.cashOnDelivery
    : {}) as Record<string, unknown>;
  return {
    currencyCode: text(row.currencyCode),
    freeDeliveryThreshold: text(row.freeDeliveryThreshold),
    standard: readPromise(row.standard),
    express: readPromise(row.express),
    cashOnDelivery: {
      available: cod.available === true,
      minOrderAmount: text(cod.minOrderAmount),
      maxOrderAmount: text(cod.maxOrderAmount),
      fee: text(cod.fee),
    },
  };
}

/** Settings of one market row (`StorefrontMarket` plus the newer fields). */
export function readMarketMerchSettings(market: unknown): MarketMerchSettings {
  const row = (market && typeof market === "object" ? market : {}) as Record<string, unknown>;
  return {
    priceEditTiers: readPriceEditTiers(row.priceEditTiers),
    delivery: readMarketDelivery(row.delivery),
  };
}
