"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import type { GiftCardTender } from "../types/promotions";
import { cartTotalsLine } from "@/styles/cartChrome";
import { checkoutTotalsLine } from "@/styles/checkoutChrome";

export function MoneySummary({
  className,
  currency,
  subtotal,
  discount,
  shipping = null,
  shippingDiscount,
  tax = 0,
  total,
  amountPayable,
  loyalty = null,
  giftCards = [],
  freeGifts = [],
  surface,
}: {
  className: string;
  currency: string;
  subtotal: number;
  discount: number;
  /** Omit the row when delivery is not part of this total. */
  shipping?: number | null;
  shippingDiscount: number;
  tax?: number;
  total: number;
  amountPayable?: number | null;
  /** Server loyalty tender. Shown after Total and before gift cards. */
  loyalty?: { points: number; amount: number; currency?: string | null } | null;
  giftCards?: GiftCardTender[];
  /** Display-only awarded gifts. Not added to subtotal, discount, or total. */
  freeGifts?: { name: string; quantity: number }[];
  /** Checkout rows use the summary total rule. Cart is the default. */
  surface?: "cart" | "checkout";
}) {
  const checkout = surface ? surface === "checkout" : className.includes("checkout");
  const totalsLine = checkout ? checkoutTotalsLine : cartTotalsLine;
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
      {shipping != null ? (
        <div>
          <dt>Shipping</dt>
          <dd dir="ltr">{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</dd>
        </div>
      ) : null}
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
      {freeGifts.map((gift, index) => (
        <div key={`${gift.name}-${index}`}>
          <dt>Free gift</dt>
          <dd dir="ltr">
            {gift.name}
            {gift.quantity > 1 ? ` ×${gift.quantity}` : ""} {formatMoney(0, currency)}
          </dd>
        </div>
      ))}
      <div className={totalsLine}>
        <dt>Total</dt>
        <dd dir="ltr">{formatMoney(total, currency)}</dd>
      </div>
      {loyalty && loyalty.points > 0 ? (
        <div>
          <dt>Reward points</dt>
          <dd dir="ltr">
            −{formatMoney(loyalty.amount, loyalty.currency || currency)}
          </dd>
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
      {showPayable ? (
        <div className={totalsLine}>
          <dt>Amount due</dt>
          <dd dir="ltr">{formatMoney(amountPayable, currency)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
