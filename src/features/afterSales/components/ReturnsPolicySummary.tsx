"use client";

import { useState } from "react";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useReturnsPolicy, type ReturnsPolicySource } from "../hooks/useAfterSales";
import type { ReturnsPolicySummary as ReturnsPolicySummaryData } from "../types/afterSales";
import { afterSalesCopyText } from "../utils/afterSalesCopy";

/** The generated return terms as a list (no loading of its own). */
export function ReturnsPolicyList({ policy }: { policy: ReturnsPolicySummaryData }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  return (
    <ul className="flex list-disc flex-col gap-1.5 ps-5 text-[13px] leading-relaxed text-sa-primary">
      {policy.items.map((item) => (
        <li key={`${item.key}.${item.variant}`}>{afterSalesCopyText(item, t, locale)}</li>
      ))}
    </ul>
  );
}

/**
 * Return terms generated from the after-sales settings (for an order: the rules
 * frozen when it was placed), so what the site says is what the refund charges.
 * Collapsed by default; loads when opened.
 */
export function ReturnsPolicySummary({
  source,
  defaultOpen = false,
}: {
  source: ReturnsPolicySource;
  defaultOpen?: boolean;
}) {
  const t = useShopCopy();
  const [open, setOpen] = useState(defaultOpen);
  const policy = useReturnsPolicy(source, open);
  const panelId = `returns-policy-${source.mode}`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center self-start text-[13px] font-semibold text-terra hover:underline"
      >
        {open ? t("returnsPolicy.hide") : t("returnsPolicy.show")}
      </button>
      {open ? (
        <div id={panelId} className="border border-sa-border bg-section-soft p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-sa-muted">
            {t("returnsPolicy.title")}
          </p>
          {policy.data ? (
            <ReturnsPolicyList policy={policy.data} />
          ) : policy.isError ? (
            <p className="text-[13px] text-sa-muted">{t("returnsPolicy.loadFailed")}</p>
          ) : (
            <p className="text-[13px] text-sa-muted">{t("returnsPolicy.loading")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
