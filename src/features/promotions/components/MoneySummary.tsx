"use client";

import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { nameInLanguage } from "@/lib/i18n/nameByLanguage";
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
  taxLabel,
  taxLabels,
  taxIncluded = false,
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
  /** Market tax label (from the market tax policy), in the answer's language. */
  taxLabel?: string;
  /** The label in every language (`{ en, ar, … }`); the page's language wins. */
  taxLabels?: Readonly<Record<string, string>> | null;
  /** True when prices already include the tax: the row is informational, not added. */
  taxIncluded?: boolean;
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
  const t = useShopCopy();
  const locale = useShopLocale();
  // The market's label in the page's language, else the worded "VAT".
  const taxName =
    nameInLanguage(taxLabels, locale, taxLabel) || t("promotions.summary.vat");
  const checkout = surface
    ? surface === "checkout"
    : className.includes("checkout");
  const totalsLine = checkout ? checkoutTotalsLine : cartTotalsLine;
  const showPayable =
    amountPayable != null &&
    Number.isFinite(amountPayable) &&
    amountPayable !== total;

  return (
    <dl className={className}>
      <div>
        <dt>{t("orders.subtotal")}</dt>
        <dd dir="ltr">{formatMoney(subtotal, currency)}</dd>
      </div>
      {discount > 0 ? (
        <div>
          <dt>{t("orders.discount")}</dt>
          <dd dir="ltr">−{formatMoney(discount, currency)}</dd>
        </div>
      ) : null}
      {shipping != null ? (
        <div>
          <dt>{t("orders.shipping")}</dt>
          <dd dir="ltr">
            {shipping === 0 ? t("orders.free") : formatMoney(shipping, currency)}
          </dd>
        </div>
      ) : null}
      {shippingDiscount > 0 ? (
        <div>
          <dt>{t("promotions.summary.shippingDiscount")}</dt>
          <dd dir="ltr">−{formatMoney(shippingDiscount, currency)}</dd>
        </div>
      ) : null}
      {tax > 0 ? (
        <div>
          <dt>{taxIncluded ? t("promotions.summary.taxIncluded", { tax: taxName }) : taxName}</dt>
          <dd dir="ltr">{formatMoney(tax, currency)}</dd>
        </div>
      ) : null}
      {freeGifts.map((gift, index) => (
        <div key={`${gift.name}-${index}`}>
          <dt>{t("checkout.confirmation.freeGift")}</dt>
          <dd dir="ltr">
            {gift.name}
            {gift.quantity > 1 ? ` ×${gift.quantity}` : ""}{" "}
            {formatMoney(0, currency)}
          </dd>
        </div>
      ))}
      <div className={totalsLine}>
        <dt>{t("orders.total")}</dt>
        <dd dir="ltr">{formatMoney(total, currency)}</dd>
      </div>
      {loyalty && loyalty.points > 0 ? (
        <div>
          <dt>{t("loyalty.redeem.title")}</dt>
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
            <dt>
              {card.maskedCode
                ? t("promotions.summary.giftCardCode", { code: card.maskedCode })
                : t("promotions.giftCard.label")}
            </dt>
            <dd dir="ltr">
              −{formatMoney(amount, card.currencyCode || currency)}
            </dd>
          </div>
        );
      })}
      {showPayable ? (
        <div className={totalsLine}>
          <dt>{t("promotions.summary.amountDue")}</dt>
          <dd dir="ltr">{formatMoney(amountPayable, currency)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
