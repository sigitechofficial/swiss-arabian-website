"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import type { PromotionSnapshotV1 } from "../types/promotions";
import { appliedOfferRows } from "../utils/appliedOffers";
import { promoAppliedList, promoAppliedRow } from "@/styles/cartChrome";

/** Swiss Arabian's applied offers list (rows: appliedOfferRows, shared with every brand). */
export function AppliedCampaigns({
  snapshot,
  hideGifts = false,
}: {
  snapshot?: PromotionSnapshotV1 | null;
  /** Checkout lists the free gift as an order line, so its "Applied" row would repeat it. */
  hideGifts?: boolean;
}) {
  const marketCurrency = useMarketCurrency();
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const rows = appliedOfferRows(data, { hideGifts });
  if (!rows.length) return null;
  const currency = data?.context?.currencyCode ?? marketCurrency;

  return (
    <ul className={promoAppliedList} aria-label="Applied offers">
      {rows.map((row) => (
        <li className={promoAppliedRow} key={row.key}>
          <span>{row.label}</span>
          {row.kind === "applied" ? (
            <span dir="ltr">Applied · {formatMoney(row.amount, currency)}</span>
          ) : row.kind === "saving" ? (
            <span dir="ltr">
              {row.tierPercent ? `${row.tierPercent}% off · ` : null}−{formatMoney(row.amount, currency)}
            </span>
          ) : (
            <span>{row.status ?? "Applied"}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
