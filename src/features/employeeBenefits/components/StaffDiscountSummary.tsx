"use client";

import { formatMoney } from "@/lib/format/money";
import type { Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  isPositiveServerMoney,
  staffAccountingStageLabel,
  staffPricingIsPayable,
  websiteHoldLabel,
  type EmployeeCheckoutView,
  type StaffLineStatus,
  type StaffQuoteLineView,
} from "../types/employeeCheckout";

function money(value: string | null, currency: string): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return formatMoney(amount, currency);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd dir="ltr">{value}</dd>
    </div>
  );
}

function rateSuffix(rate: string | null | undefined): string {
  if (!rate || !isPositiveServerMoney(rate.includes("%") ? rate.replace("%", "") : rate)) return "";
  return rate.includes("%") ? ` ${rate}` : ` ${rate}%`;
}

function lineCarriesDiscount(status: StaffLineStatus | null): boolean {
  return status === "APPLIED" || status === "NOT_APPLIED" || status === "BLOCKED_BY_PROMOTION";
}

function LineRow({ line, currency }: { line: StaffQuoteLineView; currency: string }) {
  const t = useShopCopy();
  const name = line.sku ?? t("employee.summary.item");
  const rate = lineCarriesDiscount(line.status) ? rateSuffix(line.percent) : "";
  if (line.status === "INELIGIBLE" || !lineCarriesDiscount(line.status)) {
    return (
      <li className="border-t border-sa-border py-3 first:border-t-0">
        <p className="text-[13px] font-medium text-sa-primary">{name}</p>
        <p className="mt-1 text-[12px] text-sa-secondary">
          {t("employee.summary.noAgreement", { price: money(line.originalUnitPrice, currency) })}
        </p>
      </li>
    );
  }
  if (line.status === "BLOCKED_BY_PROMOTION") {
    return (
      <li className="border-t border-sa-border py-3 first:border-t-0">
        <p className="text-[13px] font-medium text-sa-primary">{name}</p>
        <p className="mt-1 text-[12px] text-sa-secondary">
          {t("employee.summary.promotionBlocks", { price: money(line.originalUnitPrice, currency), rate })}
        </p>
      </li>
    );
  }
  const applied = line.status === "APPLIED";
  return (
    <li className="border-t border-sa-border py-3 first:border-t-0">
      <p className="text-[13px] font-medium text-sa-primary">{name}</p>
      <dl className="mt-2 grid gap-1 text-[12px] text-sa-secondary">
        <div className="flex justify-between gap-3">
          <dt>{t("employee.summary.originalPrice")}</dt>
          <dd dir="ltr">{money(line.originalUnitPrice, currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{applied ? t("employee.summary.lineDiscount", { rate }) : t("employee.summary.lineQuoted", { rate })}</dt>
          <dd dir="ltr">{money(line.staffDiscountAmount, currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{applied ? t("employee.summary.priceAfter") : t("employee.summary.previewPriceAfter")}</dt>
          <dd dir="ltr">{money(line.finalLineTotal, currency)}</dd>
        </div>
      </dl>
    </li>
  );
}

function hasApplicableDiscount(checkout: EmployeeCheckoutView): boolean {
  if (!checkout.eligible) return false;
  if (checkout.pricingApplied) return true;
  if (isPositiveServerMoney(checkout.breakdown.quotedStaffDiscount)) return true;
  return checkout.lines.some((line) => line.status === "APPLIED" || line.status === "NOT_APPLIED" || line.status === "BLOCKED_BY_PROMOTION");
}

/** Reads the Backend staffPurchase quote. Does not change the payable cart or checkout total. */
export function StaffDiscountSummary({
  checkout,
  currency,
  surface = "cart",
}: {
  checkout: EmployeeCheckoutView | null;
  currency: string;
  /** Personnel numbers are never shown. Kept so older call sites still type-check. */
  showReference?: boolean;
  surface?: "cart" | "checkout" | "order";
}) {
  const t = useShopCopy();
  if (!checkout?.authorized) return null;
  return <StaffDiscountDetails checkout={checkout} currency={currency} surface={surface} t={t} />;
}

function StaffDiscountDetails({
  checkout,
  currency,
  surface,
  t,
}: {
  checkout: EmployeeCheckoutView;
  currency: string;
  surface: "cart" | "checkout" | "order";
  t: Translator;
}) {
  const holdLabel = websiteHoldLabel(checkout.allowance?.websiteHold, t);
  const stageLabel = staffAccountingStageLabel(checkout.accountingStage, t);
  const pricingUnavailable =
    checkout.retailMirror === "UNAVAILABLE" || checkout.allowanceLedger === "UNAVAILABLE";
  const unavailableCopy =
    checkout.retailMirror === "UNAVAILABLE" && checkout.allowanceLedger === "UNAVAILABLE"
      ? t("employee.summary.unavailableBoth")
      : checkout.allowanceLedger === "UNAVAILABLE"
        ? t("employee.summary.unavailableLedger")
        : t("employee.summary.unavailableRetail");

  if (!hasApplicableDiscount(checkout)) {
    return (
      <section className="rounded-lg border border-sa-border px-4 py-4" aria-label={t("employee.summary.title")}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{t("employee.summary.title")}</p>
        {checkout.affiliationName ? (
          <p className="mt-2 text-[14px] font-semibold text-sa-primary">{checkout.affiliationName}</p>
        ) : null}
        <p className="mt-3 text-[13px] text-sa-primary">
          {pricingUnavailable ? unavailableCopy : t("employee.summary.notAvailable")}
        </p>
        {holdLabel ? (
          <p className="mt-2 text-[13px] text-sa-secondary" role="status">
            {holdLabel}
          </p>
        ) : null}
      </section>
    );
  }

  const payable = staffPricingIsPayable(checkout);
  const allowance = checkout.allowance;
  const breakdown = checkout.breakdown;
  const showConsumption = checkout.pricingApplied && isPositiveServerMoney(allowance?.thisPurchaseConsumption);
  const vatIsIncluded = breakdown.includedVat === "0" || breakdown.includedVat === "0.00";
  const appliedIsZero = !isPositiveServerMoney(breakdown.staffDiscount);
  const showQuoted = isPositiveServerMoney(breakdown.quotedStaffDiscount) && (!checkout.pricingApplied || appliedIsZero);

  return (
    <section className="rounded-lg border border-sa-border px-4 py-4" aria-label={t("employee.summary.title")}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{t("employee.summary.title")}</p>
      {checkout.affiliationName ? (
        <p className="mt-2 text-[14px] font-semibold text-sa-primary">{checkout.affiliationName}</p>
      ) : null}
      {stageLabel ? (
        <p className="mt-2 text-[13px] text-sa-secondary" role="status">
          {stageLabel}
        </p>
      ) : null}
      {holdLabel ? (
        <p className="mt-2 text-[13px] text-sa-secondary" role="status">
          {holdLabel}
        </p>
      ) : null}
      {payable ? null : (
        <p className="mt-3 text-[13px] leading-relaxed text-sa-secondary" role="status">
          {pricingUnavailable
            ? unavailableCopy
            : t("employee.summary.previewOnly")}
        </p>
      )}
      {checkout.stacking && checkout.stacking !== "NONE" && checkout.stacking !== "NO_CONFLICT" ? (
        <p className="mt-2 text-[13px] text-sa-secondary">{t("employee.summary.promotionStatus", { status: checkout.stacking })}</p>
      ) : null}
      {checkout.lines.length > 0 ? (
        <ul className="mt-3">
          {checkout.lines.map((line, index) => (
            <LineRow key={`${line.sku ?? "line"}-${index}`} line={line} currency={currency} />
          ))}
        </ul>
      ) : null}
      <dl className="mt-4 grid gap-1 text-[12px] text-sa-secondary">
        {breakdown.originalMerchandiseSubtotal ? (
          <Row label={t("employee.summary.originalSubtotal")} value={money(breakdown.originalMerchandiseSubtotal, currency)} />
        ) : null}
        {showQuoted ? (
          <Row label={t("employee.summary.quoted")} value={money(breakdown.quotedStaffDiscount, currency)} />
        ) : null}
        {breakdown.staffDiscount != null && (checkout.pricingApplied || showQuoted) ? (
          <Row
            label={payable ? t("employee.summary.discount") : appliedIsZero ? t("employee.summary.applied") : t("employee.summary.discountPreview")}
            value={money(breakdown.staffDiscount, currency)}
          />
        ) : null}
        {isPositiveServerMoney(breakdown.promotionDiscount) ? (
          <Row label={t("employee.summary.otherPromotions")} value={money(breakdown.promotionDiscount, currency)} />
        ) : null}
        {breakdown.merchandiseAfterDiscounts ? (
          <Row label={t("employee.summary.afterDiscounts")} value={money(breakdown.merchandiseAfterDiscounts, currency)} />
        ) : null}
        {isPositiveServerMoney(breakdown.shipping) ? (
          <Row label={t("orders.shipping")} value={money(breakdown.shipping, currency)} />
        ) : null}
        {vatIsIncluded ? (
          <Row label={t("employee.summary.includedVat")} value={t("employee.summary.vatInPrices")} />
        ) : breakdown.includedVat ? (
          <Row label={t("employee.summary.includedVat")} value={money(breakdown.includedVat, currency)} />
        ) : null}
        {breakdown.commerceTotal ? (
          <Row label={t("employee.summary.commerceTotal")} value={money(breakdown.commerceTotal, currency)} />
        ) : null}
        {surface !== "cart" && isPositiveServerMoney(breakdown.giftCardApplied) ? (
          <Row label={t("employee.summary.giftCard")} value={money(breakdown.giftCardApplied, currency)} />
        ) : null}
        {surface !== "cart" && isPositiveServerMoney(breakdown.loyaltyApplied) ? (
          <Row label={t("employee.summary.loyalty")} value={money(breakdown.loyaltyApplied, currency)} />
        ) : null}
        {surface !== "cart" && breakdown.amountPayable ? (
          <Row
            label={payable ? t("employee.summary.toPay") : t("employee.summary.toPayPreview")}
            value={money(breakdown.amountPayable, currency)}
          />
        ) : null}
      </dl>
      {allowance && (allowance.amountLimit || allowance.amountUsed || allowance.balanceRemaining || showConsumption) ? (
        <dl className="mt-4 grid gap-1 text-[12px] text-sa-secondary">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{t("employee.summary.d365Balance")}</p>
          <div className="flex justify-between gap-3">
            <dt>{t("employee.copy.limit")}</dt>
            <dd dir="ltr">{money(allowance.amountLimit, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t("employee.copy.used")}</dt>
            <dd dir="ltr">{money(allowance.amountUsed, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>
              {allowance.d365BalancesAreAuthoritative === true
                ? t("employee.summary.balanceAuthoritative")
                : t("employee.copy.remaining")}
            </dt>
            <dd dir="ltr">{money(allowance.balanceRemaining, currency)}</dd>
          </div>
          {showConsumption ? (
            <>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">{t("employee.summary.projection")}</p>
              {isPositiveServerMoney(allowance.otherProvisionalHolds) ? (
                <Row label={t("employee.summary.otherHolds")} value={money(allowance.otherProvisionalHolds, currency)} />
              ) : null}
              <Row
                label={t("employee.summary.consumption")}
                value={money(allowance.thisPurchaseConsumption, currency)}
              />
              <Row
                label={
                  allowance.projectedIsAuthoritative === true
                    ? t("employee.summary.projected")
                    : t("employee.copy.projectedRemaining")
                }
                value={money(allowance.projectedRemaining, currency)}
              />
            </>
          ) : null}
        </dl>
      ) : null}
      {allowance?.fits === false && checkout.pricingApplied ? (
        <p className="mt-2 text-[13px] text-sa-primary">{t("employee.summary.notCovered")}</p>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">
        {t("employee.summary.separate")}
      </p>
    </section>
  );
}
