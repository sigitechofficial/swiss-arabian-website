"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import {
  shippingDiscountAmount,
  visibleApplied,
  type PromotionApplied,
  type PromotionSnapshotV1,
} from "../types/promotions";

function rowLabel(item: PromotionApplied): string {
  return item.label?.trim() || item.code || (item.kind === "FREE_SHIPPING" ? "Free shipping" : "Offer");
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

  const currency = data?.context.currencyCode ?? "AED";

  return (
    <ul className="promo-applied-list" aria-label="Applied offers">
      {rows.map((item, index) => {
        const amount =
          item.kind === "FREE_SHIPPING"
            ? shippingDiscountAmount(data) || Number(item.amount)
            : Number(item.amount);
        return (
          <li className="promo-applied-row" key={`${item.kind}-${item.code ?? index}`}>
            <span>{rowLabel(item)}</span>
            {amount > 0 ? (
              <span dir="ltr">−{formatMoney(amount, currency)}</span>
            ) : (
              <span>Applied</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
