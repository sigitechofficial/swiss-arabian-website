"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import type { GiftCardTender } from "../types/promotions";

export function MoneySummary({
  className,
  currency,
  subtotal,
  discount,
  shipping,
  shippingDiscount,
  tax = 0,
  total,
  amountPayable,
  giftCards = [],
}: {
  className: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  shippingDiscount: number;
  tax?: number;
  total: number;
  amountPayable?: number | null;
  giftCards?: GiftCardTender[];
}) {
  const showPayable =
    amountPayable != null && Number.isFinite(amountPayable) && amountPayable !== total;

  return (
    <dl className={className}>
      <div>
        <dt>Subtotal</dt>
        <dd dir="ltr">{formatMoney(subtotal, currency)}</dd>
      </div>
      {discount > 0 ? (
        <div>
          <dt>Discount</dt>
          <dd dir="ltr">−{formatMoney(discount, currency)}</dd>
        </div>
      ) : null}
      <div>
        <dt>Shipping</dt>
        <dd dir="ltr">{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
      </div>
      {shippingDiscount > 0 ? (
        <div>
          <dt>Shipping discount</dt>
          <dd dir="ltr">−{formatMoney(shippingDiscount, currency)}</dd>
        </div>
      ) : null}
      {tax > 0 ? (
        <div>
          <dt>Tax</dt>
          <dd dir="ltr">{formatMoney(tax, currency)}</dd>
        </div>
      ) : null}
      {giftCards.map((card, index) => {
        const amount = Number(card.amount);
        if (!(amount > 0)) return null;
        return (
          <div key={card.usageId ?? card.maskedCode ?? index}>
            <dt>Gift card{card.maskedCode ? ` (${card.maskedCode})` : ""}</dt>
            <dd dir="ltr">−{formatMoney(amount, card.currencyCode || currency)}</dd>
          </div>
        );
      })}
      <div className={className.includes("checkout") ? "checkout-totals-line" : "cart-totals-line"}>
        <dt>Total</dt>
        <dd dir="ltr">{formatMoney(total, currency)}</dd>
      </div>
      {showPayable ? (
        <div className={className.includes("checkout") ? "checkout-totals-line" : "cart-totals-line"}>
          <dt>Amount due</dt>
          <dd dir="ltr">{formatMoney(amountPayable, currency)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
