import type { AfterSalesOption, AfterSalesOptions } from "../types/afterSales";

export const NOT_SHIPPED_MESSAGE =
  "Return and exchange requests are available after this order ships.";

function friendly(option: AfterSalesOption, shippedLooksOk: boolean): string | null {
  if (option.allowed) return null;
  if (option.code === "ORDER_NOT_ELIGIBLE") {
    return shippedLooksOk
      ? "Return and exchange requests aren't available for this order."
      : NOT_SHIPPED_MESSAGE;
  }
  return option.message;
}

/**
 * Which buttons to show and what to say, from the backend's answer.
 * `shippedLooksOk` is the page's own order-status check, used for wording only.
 * When the answer hasn't loaded (or failed), fall back to the status check alone —
 * the backend still refuses anything the market settings don't allow.
 */
export function resolveAfterSalesActions(
  options: AfterSalesOptions | undefined,
  shippedLooksOk: boolean,
): { canReturn: boolean; canExchange: boolean; notes: string[] } {
  if (!options) {
    return {
      canReturn: shippedLooksOk,
      canExchange: shippedLooksOk,
      notes: shippedLooksOk ? [] : [NOT_SHIPPED_MESSAGE],
    };
  }
  const returnNote = friendly(options.returns, shippedLooksOk);
  const exchangeNote = friendly(options.exchanges, shippedLooksOk);
  const notes = [returnNote, exchangeNote].filter(
    (n, i, all): n is string => Boolean(n) && all.indexOf(n) === i,
  );
  return {
    canReturn: options.returns.allowed,
    canExchange: options.exchanges.allowed,
    notes,
  };
}
