"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import type { PromotionSnapshotV1 } from "@/features/promotions/types/promotions";
import { appliedOfferRows } from "@/features/promotions/utils/appliedOffers";
import { useCartStore } from "@/stores/useCartStore";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui";
import { useSapilMoney } from "../commerce/shared";

/**
 * Offers applied to the bag (bundles, tiers, free delivery …), same rows as
 * Swiss Arabian (`appliedOfferRows`); the coupon has its own line. Checkout
 * passes its snapshot and hides gifts (they are order lines there).
 */
export function SapilAppliedOffers({
  snapshot,
  hideGifts = false,
  className,
}: {
  snapshot?: PromotionSnapshotV1 | null;
  hideGifts?: boolean;
  className?: string;
}) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const marketCurrency = useMarketCurrency();
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const rows = appliedOfferRows(data, { hideGifts });
  if (!rows.length) return null;
  const currency = data?.context?.currencyCode ?? marketCurrency;

  return (
    <ul aria-label={t("bag.appliedOffers")} className={cx("list-none p-0 m-0 mb-[8px] grid gap-[4px]", className)} data-sapil="applied-offers">
      {rows.map((row) => (
        <li key={row.key} className="flex justify-between gap-[12px] text-[13px] leading-[1.4]">
          <span className="inline-flex items-center gap-[6px] text-sapil-ink-2 min-w-0">
            <i aria-hidden="true" className="w-[6px] h-[6px] shrink-0 rounded-full bg-sapil-ok" />
            <span className="truncate">{row.label}</span>
          </span>
          <span className="shrink-0 font-[600] text-sapil-ok tabular-nums">
            {row.kind === "applied" ? (
              <>
                {t("bag.appliedRow")} · {money(row.amount, currency)}
              </>
            ) : row.kind === "saving" ? (
              <>
                {row.tierPercent ? `${t("bag.offPercent", { percent: row.tierPercent })} · ` : null}−{money(row.amount, currency)}
              </>
            ) : (
              (row.status ?? t("bag.appliedRow"))
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
