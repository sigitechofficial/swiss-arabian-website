"use client";

import type { ReactNode } from "react";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { accountBtnGhost } from "@/features/account/constants/accountForm";
import type { ReturnEstimate } from "../types/afterSales";
import { afterSalesErrorMessage } from "../utils/afterSalesErrors";
import { returnEstimateView } from "../utils/returnEstimateView";

type ReturnEstimatePanelProps = {
  estimate: ReturnEstimate | undefined;
  /** Nothing selected yet. */
  empty: boolean;
  loading: boolean;
  updating: boolean;
  error: unknown;
  /** Offered when the free gift must come back and it is on this form. */
  onAddGift?: (orderLineIds: string[]) => void;
};

function Row({
  label,
  value,
  hint,
  strong = false,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <div
        className={`flex items-baseline justify-between gap-4 ${
          strong ? "text-[15px] font-semibold text-sa-primary" : "text-[13px] text-sa-primary"
        }`}
      >
        <span className="min-w-0">{label}</span>
        <span className="shrink-0 tabular-nums">{value}</span>
      </div>
      {hint ? <p className="text-[12px] leading-relaxed text-sa-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * The refund the customer can expect for what the return form asks for. The
 * figures come from the backend (same calculator as the real refund); this only
 * lays them out. Always labelled an estimate.
 */
export function ReturnEstimatePanel({
  estimate,
  empty,
  loading,
  updating,
  error,
  onAddGift,
}: ReturnEstimatePanelProps) {
  const t = useShopCopy();
  const locale = useShopLocale();

  let body: ReactNode;
  if (empty) {
    body = <p className="text-[13px] text-sa-muted">{t("returnEstimate.selectItems")}</p>;
  } else if (!estimate && loading) {
    body = <p className="text-[13px] text-sa-muted">{t("returnEstimate.loading")}</p>;
  } else if (!estimate || error) {
    body = (
      <p className="text-[13px] leading-relaxed text-sa-muted" role="status">
        {error ? afterSalesErrorMessage(error, t) : t("returnEstimate.unavailable")}
      </p>
    );
  } else {
    const view = returnEstimateView(estimate, t, locale);
    body = (
      <>
        <div className="divide-y divide-sa-border">
          {view.rows.map((row) => (
            <Row key={row.key} strong={row.strong} label={row.label} value={row.value} hint={row.hint} />
          ))}
        </div>

        {view.giftRequired ? (
          <div
            className="flex flex-col gap-2 border border-terra/40 bg-section-soft p-3"
            role="alert"
          >
            <p className="text-[13px] font-semibold text-sa-primary">
              {t("returnEstimate.giftRequiredTitle")}
            </p>
            <p className="text-[13px] leading-relaxed text-sa-primary">
              {t("afterSales.err.giftRequired")}
            </p>
            {onAddGift ? (
              <button
                type="button"
                className={`${accountBtnGhost} self-start`}
                onClick={() => onAddGift(view.giftRequired!.lineIds)}
              >
                {t("returnEstimate.addGift")}
              </button>
            ) : null}
          </div>
        ) : null}

        <ul className="flex list-disc flex-col gap-1 ps-5 text-[12px] leading-relaxed text-sa-muted">
          {view.notes.map((note) => (
            <li key={note.key}>{note.text}</li>
          ))}
        </ul>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
            {t("returnEstimate.whereMoneyGoes")}
          </p>
          <p className="text-[12px] leading-relaxed text-sa-muted">{view.destination}</p>
        </div>
      </>
    );
  }

  return (
    <section
      aria-live="polite"
      aria-busy={updating || loading}
      className="flex flex-col gap-3 border border-sa-border bg-section-soft p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          {t("returnEstimate.title")}
        </h3>
        {updating && estimate ? (
          <span className="text-[11px] text-sa-muted">{t("returnEstimate.updating")}</span>
        ) : null}
      </div>
      {body}
    </section>
  );
}
