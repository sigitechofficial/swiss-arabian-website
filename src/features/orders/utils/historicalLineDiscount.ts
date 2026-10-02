/** Frozen P10 line snapshot. Unknown versions are skipped, not rendered. */

export type OrderLinePromotionAllocation = {
  kind: string;
  code: string;
  discountType: string;
  amount: string;
};

export type OrderLinePromotionSnapshot = {
  v: number;
  discountTotal: string;
  allocations?: OrderLinePromotionAllocation[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Stored line discount for display. Does not sum allocations or compare prices.
 * Returns null for legacy, malformed, unknown-version, or zero snapshots.
 */
export function historicalLineDiscount(snapshot: unknown): number | null {
  const row = asRecord(snapshot);
  if (!row || row.v !== 1) return null;
  if (typeof row.discountTotal !== "string") return null;
  const amount = Number(row.discountTotal);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}
