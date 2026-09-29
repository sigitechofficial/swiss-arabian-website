"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import {
  appliedPromotionView,
  visibleApplied,
  type PromotionSnapshotV1,
} from "../types/promotions";

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
        const view = appliedPromotionView(item, data);
        return (
          <li className="promo-applied-row" key={`${item.kind}-${item.code ?? "row"}-${index}`}>
            <span>{view.label}</span>
            {view.amount != null && view.amount > 0 ? (
              <span dir="ltr">−{formatMoney(view.amount, currency)}</span>
            ) : (
              <span>{view.status ?? "Applied"}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
