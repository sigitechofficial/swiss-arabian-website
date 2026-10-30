"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
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
  const rate = lineCarriesDiscount(line.status) ? rateSuffix(line.percent) : "";
  if (line.status === "INELIGIBLE" || !lineCarriesDiscount(line.status)) {
    return (
      <li className="border-t border-sa-border py-3 first:border-t-0">
        <p className="text-[13px] font-medium text-sa-primary">{line.sku ?? "Item"}</p>
        <p className="mt-1 text-[12px] text-sa-secondary">
          Regular price {money(line.originalUnitPrice, currency)}. No staff agreement on this product.
        </p>
      </li>
    );
  }
  if (line.status === "BLOCKED_BY_PROMOTION") {
    return (
      <li className="border-t border-sa-border py-3 first:border-t-0">
        <p className="text-[13px] font-medium text-sa-primary">{line.sku ?? "Item"}</p>
        <p className="mt-1 text-[12px] text-sa-secondary">
          Regular price {money(line.originalUnitPrice, currency)}. A promotion applies to this item, so the staff
          discount{rate} is not combined with it.
        </p>
      </li>
    );
  }
  const applied = line.status === "APPLIED";
  return (
    <li className="border-t border-sa-border py-3 first:border-t-0">
      <p className="text-[13px] font-medium text-sa-primary">{line.sku ?? "Item"}</p>
      <dl className="mt-2 grid gap-1 text-[12px] text-sa-secondary">
        <div className="flex justify-between gap-3">
          <dt>Original price, tax included</dt>
          <dd dir="ltr">{money(line.originalUnitPrice, currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{applied ? `Staff Discount${rate}` : `Quoted Staff Discount${rate}`}</dt>
          <dd dir="ltr">{money(line.staffDiscountAmount, currency)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{applied ? "Price after staff discount" : "Preview price after staff discount"}</dt>
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
  if (!checkout?.authorized) return null;

  const holdLabel = websiteHoldLabel(checkout.allowance?.websiteHold);
  const stageLabel = staffAccountingStageLabel(checkout.accountingStage);
  const pricingUnavailable =
    checkout.retailMirror === "UNAVAILABLE" || checkout.allowanceLedger === "UNAVAILABLE";
  const unavailableCopy =
    checkout.retailMirror === "UNAVAILABLE" && checkout.allowanceLedger === "UNAVAILABLE"
      ? "Staff pricing was not applied. The retail discount offer and website allowance tracking are temporarily unavailable."
      : checkout.allowanceLedger === "UNAVAILABLE"
        ? "Staff pricing was not applied. Website allowance tracking is temporarily unavailable."
        : "Staff pricing was not applied. The retail discount offer is temporarily unavailable.";

  if (!hasApplicableDiscount(checkout)) {
    return (
      <section className="rounded-lg border border-sa-border px-4 py-4" aria-label="Staff discount">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Staff discount</p>
        {checkout.affiliationName ? (
          <p className="mt-2 text-[14px] font-semibold text-sa-primary">{checkout.affiliationName}</p>
        ) : null}
        <p className="mt-3 text-[13px] text-sa-primary">
          {pricingUnavailable ? unavailableCopy : "Staff discount is not available on this order."}
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
    <section className="rounded-lg border border-sa-border px-4 py-4" aria-label="Staff discount">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Staff discount</p>
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
            : "Preview only. This is not the amount you pay, and it is not deducted in D365."}
        </p>
      )}
      {checkout.stacking && checkout.stacking !== "NONE" && checkout.stacking !== "NO_CONFLICT" ? (
        <p className="mt-2 text-[13px] text-sa-secondary">Promotion status: {checkout.stacking}</p>
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
          <Row label="Original merchandise subtotal" value={money(breakdown.originalMerchandiseSubtotal, currency)} />
        ) : null}
        {showQuoted ? (
          <Row label="Quoted Staff Discount" value={money(breakdown.quotedStaffDiscount, currency)} />
        ) : null}
        {breakdown.staffDiscount != null && (checkout.pricingApplied || showQuoted) ? (
          <Row
            label={payable ? "Staff Discount" : appliedIsZero ? "Applied Staff Discount" : "Staff Discount (preview)"}
            value={money(breakdown.staffDiscount, currency)}
          />
        ) : null}
        {isPositiveServerMoney(breakdown.promotionDiscount) ? (
          <Row label="Other promotions" value={money(breakdown.promotionDiscount, currency)} />
        ) : null}
        {breakdown.merchandiseAfterDiscounts ? (
          <Row label="Merchandise total after discounts" value={money(breakdown.merchandiseAfterDiscounts, currency)} />
        ) : null}
        {isPositiveServerMoney(breakdown.shipping) ? (
          <Row label="Shipping" value={money(breakdown.shipping, currency)} />
        ) : null}
        {vatIsIncluded ? (
          <Row label="Included VAT" value="Included in these prices" />
        ) : breakdown.includedVat ? (
          <Row label="Included VAT" value={money(breakdown.includedVat, currency)} />
        ) : null}
        {breakdown.commerceTotal ? (
          <Row label="Commerce total" value={money(breakdown.commerceTotal, currency)} />
        ) : null}
        {surface !== "cart" && isPositiveServerMoney(breakdown.giftCardApplied) ? (
          <Row label="Gift card payment" value={money(breakdown.giftCardApplied, currency)} />
        ) : null}
        {surface !== "cart" && isPositiveServerMoney(breakdown.loyaltyApplied) ? (
          <Row label="Loyalty redemption" value={money(breakdown.loyaltyApplied, currency)} />
        ) : null}
        {surface !== "cart" && breakdown.amountPayable ? (
          <Row
            label={payable ? "Amount still to pay" : "Amount still to pay before this preview"}
            value={money(breakdown.amountPayable, currency)}
          />
        ) : null}
      </dl>
      {allowance && (allowance.amountLimit || allowance.amountUsed || allowance.balanceRemaining || showConsumption) ? (
        <dl className="mt-4 grid gap-1 text-[12px] text-sa-secondary">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">D365 balance</p>
          <div className="flex justify-between gap-3">
            <dt>Amount limit</dt>
            <dd dir="ltr">{money(allowance.amountLimit, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Amount used in D365</dt>
            <dd dir="ltr">{money(allowance.amountUsed, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>
              Balance remaining
              {allowance.d365BalancesAreAuthoritative === true ? " (authoritative)" : " in D365"}
            </dt>
            <dd dir="ltr">{money(allowance.balanceRemaining, currency)}</dd>
          </div>
          {showConsumption ? (
            <>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Website projection</p>
              {isPositiveServerMoney(allowance.otherProvisionalHolds) ? (
                <Row label="Other provisional holds" value={money(allowance.otherProvisionalHolds, currency)} />
              ) : null}
              <Row
                label="Estimated consumption for this purchase"
                value={money(allowance.thisPurchaseConsumption, currency)}
              />
              <Row
                label={
                  allowance.projectedIsAuthoritative === true
                    ? "Projected remaining"
                    : "Projected remaining. Not yet deducted in D365"
                }
                value={money(allowance.projectedRemaining, currency)}
              />
            </>
          ) : null}
        </dl>
      ) : null}
      {allowance?.fits === false && checkout.pricingApplied ? (
        <p className="mt-2 text-[13px] text-sa-primary">The staff allowance does not cover this quote.</p>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">
        Staff allowance is not a payment method and is separate from Customer Rewards and gift cards.
      </p>
    </section>
  );
}
