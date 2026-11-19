"use client";

import { CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMarket } from "@/providers/MarketProvider";
import { checkoutNote } from "@/styles/checkoutChrome";
import { pageTitle } from "@/styles/shopChrome";
import { useReturnsPolicy } from "../hooks/useAfterSales";
import { ReturnsPolicyList } from "./ReturnsPolicySummary";

/**
 * `/return-terms`: the selected market's return, exchange and cancellation terms
 * today, generated from its after-sales settings so they always match what a
 * refund charges. Shown before purchase (linked from the bag and checkout).
 * An order keeps the terms frozen when it was placed (shown on the order page).
 */
export function ReturnTermsPageView() {
  const t = useShopCopy();
  const { marketId, regionOptions } = useMarket();
  const zoneCode = marketId ?? "";
  const market =
    regionOptions.find((option) => option.id === marketId)?.label ?? zoneCode;
  const policy = useReturnsPolicy({ mode: "market", zoneCode });

  return (
    <CheckoutStateShell current={t("returnsPolicy.termsPage.title")}>
      <div className="mx-auto w-full max-w-2xl pb-16">
        <header className="mb-6">
          <h1 className={pageTitle}>{t("returnsPolicy.termsPage.title")}</h1>
          <p className={checkoutNote}>
            {t("returnsPolicy.termsPage.intro", { market })}
          </p>
        </header>
        <section
          aria-busy={policy.isLoading}
          className="border border-sa-border bg-section-soft p-4 sm:p-6"
        >
          {policy.data ? (
            <ReturnsPolicyList policy={policy.data} />
          ) : policy.isError ? (
            <p role="alert" className="text-[13px] text-sa-muted">
              {t("returnsPolicy.termsPage.loadFailed")}
            </p>
          ) : (
            <p className="text-[13px] text-sa-muted">{t("returnsPolicy.loading")}</p>
          )}
        </section>
      </div>
    </CheckoutStateShell>
  );
}
