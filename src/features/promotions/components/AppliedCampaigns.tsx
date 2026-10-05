"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import {
  appliedPromotionView,
  isFixedAmountBxgy,
  isFreeShippingBenefit,
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

export function AppliedCampaigns({
  snapshot,
}: {
  snapshot?: PromotionSnapshotV1 | null;
}) {
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const rows = visibleApplied(data).filter((item) => item.kind !== "COUPON");
  if (!rows.length) return null;

  const currency = data?.context?.currencyCode ?? "AED";

  return (
    <ul className="promo-applied-list" aria-label="Applied offers">
      {rows.map((item, index) => {
        const view = appliedPromotionView(item, data);
        const tierPercent = selectedTierPercent(item);
        const quotedAmount = view.amount != null && view.amount > 0;
        const partialShipping = item.level === "SHIPPING" && !isFreeShippingBenefit(item) && quotedAmount;
        const fixedBxgy = isFixedAmountBxgy(item) && quotedAmount;
        return (
          <li className="promo-applied-row" key={`${item.kind}-${item.code ?? "row"}-${index}`}>
            <span>{view.label}</span>
            {partialShipping || fixedBxgy ? (
              <span dir="ltr">Applied · {formatMoney(view.amount ?? 0, currency)}</span>
            ) : view.amount != null && view.amount > 0 ? (
              <span dir="ltr">
                {tierPercent ? `${tierPercent}% off · ` : null}
                −{formatMoney(view.amount, currency)}
              </span>
            ) : (
              <span>{view.status ?? "Applied"}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
