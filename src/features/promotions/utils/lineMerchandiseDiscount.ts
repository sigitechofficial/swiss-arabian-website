import { roundMoney } from "@/lib/format/money";
import type { PromotionSnapshotV1 } from "../types/promotions";

type DiscountLine = {
  cartItemId?: string | null;
  sku?: string | null;
};

/** Merchandise discount the quote assigned to this line. Shipping and gift cards are not included. */
export function lineMerchandiseDiscount(
  snapshot: PromotionSnapshotV1 | null | undefined,
  line: DiscountLine,
  currency: string,
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
  return roundMoney(total, currency);
}

export function linePrices(
  listTotal: number,
  discount: number,
  currency: string,
): { list: number; sale: number | null } {
  const list = roundMoney(listTotal, currency);
  if (!Number.isFinite(list) || list <= 0 || discount <= 0) return { list, sale: null };
  const sale = roundMoney(list - discount, currency);
  if (sale >= list) return { list, sale: null };
  return { list, sale: Math.max(0, sale) };
}
