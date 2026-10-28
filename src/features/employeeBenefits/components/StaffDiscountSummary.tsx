"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  staffPricingIsPayable,
  type EmployeeCheckoutView,
  type StaffQuoteLineView,
} from "../types/employeeCheckout";

function money(value: string | null, currency: string): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return formatMoney(amount, currency);
}

function LineRow({ line, currency, payable }: { line: StaffQuoteLineView; currency: string; payable: boolean }) {
  return (
    <li className="border-t border-sa-border py-3 first:border-t-0">
      <p className="text-[13px] font-medium text-sa-primary">{line.name ?? line.sku ?? "Item"}</p>
      {line.eligible ? (
        <dl className="mt-2 grid gap-1 text-[12px] text-sa-secondary">
          <div className="flex justify-between gap-3">
            <dt>Original price, tax included</dt>
            <dd dir="ltr">{money(line.originalPrice, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Staff discount</dt>
            <dd dir="ltr">{money(line.staffDiscount, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{payable ? "Price after staff discount" : "Preview price after staff discount"}</dt>
            <dd dir="ltr">{money(line.priceAfter, currency)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-1 text-[12px] text-sa-secondary">
          Regular price {money(line.originalPrice, currency)}. No staff agreement on this product.
        </p>
      )}
      {line.conflict ? <p className="mt-1 text-[12px] text-sa-secondary">{line.conflict}</p> : null}
    </li>
  );
}

/** Reads the Backend staff quote. Does not change the payable cart or checkout total. */
export function StaffDiscountSummary({
  checkout,
  currency,
  showReference = true,
}: {
  checkout: EmployeeCheckoutView | null;
  currency: string;
  showReference?: boolean;
}) {
  if (!checkout) return null;
  if (!checkout.eligible) {
    return (
      <section className="rounded-lg border border-sa-border px-4 py-4" aria-label="Staff discount">
        <p className="text-[13px] text-sa-primary">Staff discount is not available on this order.</p>
      </section>
    );
  }

  const payable = staffPricingIsPayable(checkout);
  const allowance = checkout.allowance;

  return (
    <section className="rounded-lg border border-sa-border px-4 py-4" aria-label="Staff discount">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Staff discount</p>
      {checkout.affiliationName ? (
        <p className="mt-2 text-[14px] font-semibold text-sa-primary">{checkout.affiliationName}</p>
      ) : null}
      {showReference && checkout.personnelNumber ? (
        <p className="mt-1 text-[12px] text-sa-secondary">Employee reference {checkout.personnelNumber}</p>
      ) : null}
      {payable ? null : (
        <p className="mt-3 text-[13px] leading-relaxed text-sa-secondary" role="status">
          Preview only. This is not the amount you pay, and it is not deducted in D365.
        </p>
      )}
      {checkout.taxContractMismatch ? (
        <p className="mt-2 text-[13px] leading-relaxed text-sa-secondary" role="status">
          The server total adds tax on a price that already includes tax. This checkout does not change that figure.
        </p>
      ) : null}
      {checkout.stacking ? (
        <p className="mt-2 text-[13px] text-sa-secondary">Promotion status: {checkout.stacking}</p>
      ) : null}
      {checkout.lines.length > 0 ? (
        <ul className="mt-3">
          {checkout.lines.map((line, index) => (
            <LineRow key={`${line.sku ?? "line"}-${index}`} line={line} currency={currency} payable={payable} />
          ))}
        </ul>
      ) : null}
      {checkout.staffDiscountTotal ? (
        <p className="mt-3 text-[13px] text-sa-primary">
          Total staff discount {money(checkout.staffDiscountTotal, currency)}
          {payable ? "" : " (preview)"}
        </p>
      ) : null}
      {allowance ? (
        <dl className="mt-4 grid gap-1 text-[12px] text-sa-secondary">
          <div className="flex justify-between gap-3">
            <dt>Amount limit</dt>
            <dd dir="ltr">{money(allowance.amountLimit, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Amount used</dt>
            <dd dir="ltr">{money(allowance.amountUsed, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Balance remaining</dt>
            <dd dir="ltr">{money(allowance.balanceRemaining, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Estimated consumption for this purchase</dt>
            <dd dir="ltr">{money(allowance.estimatedConsumption, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Projected remaining. Not yet deducted in D365</dt>
            <dd dir="ltr">{money(allowance.projectedRemaining, currency)}</dd>
          </div>
        </dl>
      ) : null}
      {allowance?.insufficient ? (
        <p className="mt-2 text-[13px] text-sa-primary">The staff allowance does not cover this quote.</p>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-sa-secondary">
        Staff allowance is not a payment method and is separate from Customer Rewards and gift cards.
      </p>
    </section>
  );
}
