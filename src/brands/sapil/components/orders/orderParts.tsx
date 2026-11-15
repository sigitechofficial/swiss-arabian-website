"use client";

import type { ReactNode } from "react";
import { ORDER_PROGRESS_STEPS } from "@/features/orders/utils/orderStatus";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import type { SapilMoney } from "../commerce/shared";
import type { OrderLineView, OrderStep, OrderTotalRow } from "./SapilOrderView";

/** The five delivery steps; steps up to the current one are done, the next one is highlighted. */
export function orderSteps(t: SapilTranslator, currentStep: number): OrderStep[] {
  return ORDER_PROGRESS_STEPS.map((step, index) => ({
    key: step,
    label: t(`account.step${step}` as SapilCopyKey),
    detail: t(`account.step${step}Hint` as SapilCopyKey),
    state: index <= currentStep ? "done" : index === currentStep + 1 ? "next" : "todo",
  }));
}

type OrderTotals = {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  giftCardApplied?: string | null;
  loyaltyApplied?: string | null;
  amountPayable?: string | null;
};

/**
 * Gift card and reward points are tenders, not discounts: the total stays the
 * same, but the shopper must see how it was paid, and what the payment method
 * itself collected. Empty when the payment method paid everything.
 */
export function orderTenders(
  t: SapilTranslator,
  money: SapilMoney,
  totals: OrderTotals,
  currency: string,
  paymentLabel: ReactNode,
): { rows: OrderTotalRow[]; charged: number | null } {
  const giftCard = Number(totals.giftCardApplied ?? 0);
  const points = Number(totals.loyaltyApplied ?? 0);
  if (totals.amountPayable == null || (giftCard <= 0 && points <= 0)) return { rows: [], charged: null };
  const charged = Number(totals.amountPayable);
  const rows: OrderTotalRow[] = [];
  if (giftCard > 0) rows.push({ key: "gc", label: t("account.odPaidGiftCard"), value: `−${money(giftCard, currency)}`, tone: "save" });
  if (points > 0) rows.push({ key: "points", label: t("account.odPaidPoints"), value: `−${money(points, currency)}`, tone: "save" });
  rows.push({ key: "charged", label: paymentLabel, value: money(charged, currency) });
  return { rows, charged };
}

/**
 * The order's frozen money, as rows. Whether the tax is already inside the
 * total is read from the order itself (subtotal − discount + delivery = total).
 */
export function orderTotals(t: SapilTranslator, money: SapilMoney, totals: OrderTotals, currency: string) {
  const subtotal = Number(totals.subtotal);
  const discount = Number(totals.discount);
  const shipping = Number(totals.shipping);
  const tax = Number(totals.tax);
  const total = Number(totals.total);
  const rows: OrderTotalRow[] = [{ key: "sub", label: t("account.odSubtotal"), value: money(subtotal, currency) }];
  if (discount > 0) rows.push({ key: "disc", label: t("account.odDiscount"), value: `−${money(discount, currency)}`, tone: "save" });
  rows.push({ key: "ship", label: t("account.odDelivery"), value: shipping > 0 ? money(shipping, currency) : t("account.odFree") });
  const taxIncluded = tax > 0 && Math.abs(subtotal - discount + shipping - total) < 0.01;
  if (tax > 0 && !taxIncluded) rows.push({ key: "tax", label: t("account.odTax"), value: money(tax, currency) });
  return {
    rows,
    grandTotal: { label: t("account.odTotal"), value: money(total, currency) },
    vatNote: taxIncluded ? t("account.odTaxIncluded", { amount: money(tax, currency) }) : undefined,
  };
}

type OrderLine = {
  orderLineId: string;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: string;
  lineTotal: string;
  currencyCode: string;
  imageUrl?: string | null;
  isGift?: boolean;
};

export function orderLines(t: SapilTranslator, money: SapilMoney, lines: OrderLine[], currency: string): OrderLineView[] {
  return lines.map((line) => {
    const name = line.productName ?? line.sku;
    const qty = Number.parseInt(line.quantity, 10) || 1;
    const variant =
      line.variantName && line.variantName.trim().toLowerCase() !== name.trim().toLowerCase() ? line.variantName : null;
    return {
      key: line.orderLineId,
      name,
      imageSrc: line.imageUrl?.startsWith("http") ? line.imageUrl : undefined,
      meta: [line.isGift ? t("account.odFreeGift") : null, variant, t("account.odQty", { count: qty })].filter(Boolean).join(" · "),
      price: line.isGift ? t("account.odFree") : money(Number(line.lineTotal), line.currencyCode || currency),
    };
  });
}

export function itemCountOf(lines: Array<{ quantity: string }>): number {
  return lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0);
}

type Address = { fullName: string | null; address1: string | null; city: string | null; countryCode: string | null };

export function countryLabel(code: string | null, locale: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function AddressLines({ address, locale }: { address: Address; locale: string }): ReactNode {
  const cityLine = [address.city, countryLabel(address.countryCode, locale)].filter(Boolean).join(", ");
  return (
    <p>
      {address.fullName ? <b>{address.fullName}</b> : null}
      {address.address1 ? (
        <>
          <br />
          {address.address1}
        </>
      ) : null}
      {cityLine ? (
        <>
          <br />
          {cityLine}
        </>
      ) : null}
    </p>
  );
}
