import type { AfterSalesOption, AfterSalesOptions } from "../types/afterSales";
import { englishTranslator, type MessageKey, type Translator } from "@/lib/i18n/messages";

export const NOT_SHIPPED_MESSAGE =
  "Return and exchange requests are available after this order ships.";

type Kind = "return" | "exchange" | "both";

/**
 * Why a return / exchange can't be asked, in the shopper's language, by the
 * backend's code (its English message is only the fallback for a new code).
 */
const BLOCK_KEYS: Record<string, Record<Kind, MessageKey>> = {
  RETURN_POLICY_NOT_CONFIGURED: {
    return: "afterSales.block.offline.return",
    exchange: "afterSales.block.offline.exchange",
    both: "afterSales.block.offline.both",
  },
  RETURNS_DISABLED: {
    return: "afterSales.block.offline.return",
    exchange: "afterSales.block.offline.exchange",
    both: "afterSales.block.offline.both",
  },
  EXCHANGES_DISABLED: {
    return: "afterSales.block.offline.return",
    exchange: "afterSales.block.offline.exchange",
    both: "afterSales.block.offline.both",
  },
  AFTER_SALES_STAFF_ONLY: {
    return: "afterSales.block.staffOnly.return",
    exchange: "afterSales.block.staffOnly.exchange",
    both: "afterSales.block.staffOnly.both",
  },
  AFTER_SALES_SIGN_IN_REQUIRED: {
    return: "afterSales.block.signIn.return",
    exchange: "afterSales.block.signIn.exchange",
    both: "afterSales.block.signIn.both",
  },
  AFTER_SALES_NOT_DELIVERED_YET: {
    return: "afterSales.block.notDelivered.return",
    exchange: "afterSales.block.notDelivered.exchange",
    both: "afterSales.block.notDelivered.both",
  },
  AFTER_SALES_NOT_SHIPPED_YET: {
    return: "afterSales.block.notShipped.return",
    exchange: "afterSales.block.notShipped.exchange",
    both: "afterSales.block.notShipped.both",
  },
  RETURN_WINDOW_CLOSED: {
    return: "afterSales.block.windowClosed.return",
    exchange: "afterSales.block.windowClosed.exchange",
    both: "afterSales.block.windowClosed.both",
  },
  EXCHANGE_WINDOW_CLOSED: {
    return: "afterSales.block.windowClosed.return",
    exchange: "afterSales.block.windowClosed.exchange",
    both: "afterSales.block.windowClosed.both",
  },
  NOTHING_LEFT_TO_REQUEST: {
    return: "afterSales.block.nothingLeft",
    exchange: "afterSales.block.nothingLeft",
    both: "afterSales.block.nothingLeft",
  },
};

/** Formats the last day to ask ("4 December 2026"); defaults to the ISO day. */
export type AfterSalesDateFormat = (iso: string) => string;
const isoDay: AfterSalesDateFormat = (iso) => iso.slice(0, 10);

function friendly(
  option: AfterSalesOption,
  kind: Kind,
  shippedLooksOk: boolean,
  t: Translator,
  formatDate: AfterSalesDateFormat,
): string | null {
  if (option.allowed) return null;
  if (option.code === "ORDER_NOT_ELIGIBLE") {
    return shippedLooksOk ? t("afterSales.notAvailable") : t("afterSales.notShipped");
  }
  const key = option.code ? BLOCK_KEYS[option.code]?.[kind] : undefined;
  if (!key) return option.message;
  return t(key, { date: option.eligibleUntil ? formatDate(option.eligibleUntil) : "" });
}

/** Why one of return / exchange is not offered for the order (null when it is). */
export function afterSalesOptionNote(
  option: AfterSalesOption,
  kind: "return" | "exchange",
  shippedLooksOk: boolean,
  t: Translator = englishTranslator,
  formatDate: AfterSalesDateFormat = isoDay,
): string | null {
  return friendly(option, kind, shippedLooksOk, t, formatDate);
}

/**
 * Which buttons to show and what to say, from the backend's answer.
 * `shippedLooksOk` is the page's own order-status check, used for wording only.
 * When the answer hasn't loaded (or failed), fall back to the status check alone —
 * the backend still refuses anything the market settings don't allow.
 * Both blocked for the same reason: one sentence that names both.
 */
export function resolveAfterSalesActions(
  options: AfterSalesOptions | undefined,
  shippedLooksOk: boolean,
  t: Translator = englishTranslator,
  formatDate: AfterSalesDateFormat = isoDay,
): { canReturn: boolean; canExchange: boolean; notes: string[] } {
  if (!options) {
    return {
      canReturn: shippedLooksOk,
      canExchange: shippedLooksOk,
      notes: shippedLooksOk ? [] : [t("afterSales.notShipped")],
    };
  }
  const { returns, exchanges } = options;
  const sameReason =
    !returns.allowed && !exchanges.allowed && returns.code !== null && returns.code === exchanges.code;
  const notes = sameReason
    ? [friendly(returns, "both", shippedLooksOk, t, formatDate)]
    : [friendly(returns, "return", shippedLooksOk, t, formatDate), friendly(exchanges, "exchange", shippedLooksOk, t, formatDate)];
  return {
    canReturn: returns.allowed,
    canExchange: exchanges.allowed,
    notes: notes.filter((n, i, all): n is string => Boolean(n) && all.indexOf(n) === i),
  };
}
