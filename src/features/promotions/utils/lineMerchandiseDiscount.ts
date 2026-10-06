import type { PromotionSnapshotV1 } from "../types/promotions";

type DiscountLine = {
  cartItemId?: string | null;
  sku?: string | null;
};

/** Merchandise discount the quote assigned to this line. Shipping and gift cards are not included. */
export function lineMerchandiseDiscount(
  snapshot: PromotionSnapshotV1 | null | undefined,
  line: DiscountLine,
): number {
  let total = 0;
  for (const row of snapshot?.lineAllocations ?? []) {
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const matched = line.cartItemId
      ? row.ref === line.cartItemId
      : Boolean(line.sku && row.sku && row.sku === line.sku);
    if (matched) total += amount;
  }
  return Math.round(total * 100) / 100;
}

export function linePrices(
  listTotal: number,
  discount: number,
): { list: number; sale: number | null } {
  const list = Math.round(listTotal * 100) / 100;
  if (!Number.isFinite(list) || list <= 0 || discount <= 0) return { list, sale: null };
  const sale = Math.round((list - discount) * 100) / 100;
  if (sale >= list) return { list, sale: null };
  return { list, sale: Math.max(0, sale) };
}
