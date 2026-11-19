import {
  appliedPromotionView,
  isFixedAmountBxgy,
  isFreeShippingBenefit,
  isGiftApplied,
  visibleApplied,
  type PromotionApplied,
  type PromotionSnapshotV1,
} from "../types/promotions";

function selectedTierPercent(item: PromotionApplied): string | null {
  const selected = item.metadata?.selectedTier;
  if (!selected || typeof selected !== "object") return null;
  const raw = (selected as { percentage?: unknown }).percentage;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw)
    .trim()
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

/**
 * One applied offer as a bag / checkout row, for every brand:
 * - `applied`: shows "Applied · amount" (part of delivery, a fixed-amount buy-X-get-Y),
 * - `saving`: shows "−amount", with the tier's percent when one was chosen,
 * - `status`: no amount (e.g. free delivery): the server's status, else "Applied".
 */
export type AppliedOfferRow = {
  key: string;
  label: string;
  kind: "applied" | "saving" | "status";
  amount: number;
  tierPercent: string | null;
  status: string | null;
};

/** The applied offers to list (coupons have their own line; checkout lists gifts as lines). */
export function appliedOfferRows(
  data: PromotionSnapshotV1 | null | undefined,
  { hideGifts = false }: { hideGifts?: boolean } = {},
): AppliedOfferRow[] {
  return visibleApplied(data)
    .filter((item) => item.kind !== "COUPON" && !(hideGifts && isGiftApplied(item)))
    .map((item, index) => {
      const view = appliedPromotionView(item, data);
      const quoted = view.amount != null && view.amount > 0;
      const partialShipping = item.level === "SHIPPING" && !isFreeShippingBenefit(item) && quoted;
      const fixedBxgy = isFixedAmountBxgy(item) && quoted;
      return {
        key: `${item.kind}-${item.code ?? "row"}-${index}`,
        label: view.label,
        kind: partialShipping || fixedBxgy ? "applied" : quoted ? "saving" : "status",
        amount: view.amount ?? 0,
        tierPercent: selectedTierPercent(item),
        status: view.status ?? null,
      };
    });
}
