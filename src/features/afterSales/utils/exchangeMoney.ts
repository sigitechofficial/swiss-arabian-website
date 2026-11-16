import type { ExchangeMoneyView } from "../types/afterSales";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

/** Query parameter that marks a return from the exchange payment page. */
export const EXCHANGE_PAYMENT_PARAM = "exchangePayment";

export type ExchangeMoneyCopy = {
  title: string;
  body: string;
  /** Amount to show beside the title (decimal string), when there is one. */
  amount: string | null;
  /** Show the Pay button. Never true when a refund is due. */
  canPay: boolean;
};

function positive(value: string | null | undefined): string | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(value) : null;
}

/**
 * What to show for an exchange's money state. Driven only by the backend's
 * `money.action`; `null` means there is nothing to show (even swap).
 */
export function exchangeMoneyCopy(
  money: ExchangeMoneyView,
  t: Translator = englishTranslator,
): ExchangeMoneyCopy | null {
  const payable = positive(money.customerPayableAmount);
  const refundable = positive(money.refundableDifferenceAmount);
  switch (money.action) {
    case "PAY_DIFFERENCE":
    case "AWAITING_PAYMENT":
      return {
        title: t("exchangeMoney.dueTitle"),
        body: t("exchangeMoney.dueBody"),
        amount: payable,
        canPay: true,
      };
    case "PAYMENT_COMPLETE":
      return {
        title: t("exchangeMoney.receivedTitle"),
        body: t("exchangeMoney.receivedBody"),
        amount: payable,
        canPay: false,
      };
    case "REFUND_PENDING":
      return {
        title: t("exchangeMoney.refundTitle"),
        body: money.note || t("exchangeMoney.refundBody"),
        amount: refundable,
        canPay: false,
      };
    case "REFUND_COMPLETE":
      return {
        title: t("exchangeMoney.refundedTitle"),
        body: t("orders.refund.completed"),
        amount: refundable,
        canPay: false,
      };
    case "CONTACT_SUPPORT":
      return {
        title: t("exchangeMoney.contactTitle"),
        body: money.note || t("exchangeMoney.contactBody"),
        amount: null,
        canPay: false,
      };
    default:
      return null;
  }
}

/**
 * Where the payment page sends the shopper back: this same page, marked with
 * the exchange id. Only the path is kept — any query (such as a guest tracking
 * token) stays out of the address handed to the payment provider.
 */
export function exchangePaymentReturnUrl(
  exchangeRequestId: string,
  location: { origin: string; pathname: string },
): string {
  const params = new URLSearchParams({ [EXCHANGE_PAYMENT_PARAM]: exchangeRequestId });
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

export function isReturningFromExchangePayment(exchangeRequestId: string, search: string): boolean {
  return new URLSearchParams(search).get(EXCHANGE_PAYMENT_PARAM) === exchangeRequestId;
}

/** Any exchange payment return on this page (used to open the right tab). */
export function hasExchangePaymentReturn(search: string): boolean {
  return Boolean(new URLSearchParams(search).get(EXCHANGE_PAYMENT_PARAM));
}
