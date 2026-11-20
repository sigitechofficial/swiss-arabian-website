import { describe, expect, it } from "vitest";
import type { AfterSalesOptions } from "../types/afterSales";
import { NOT_SHIPPED_MESSAGE, resolveAfterSalesActions } from "./afterSalesOptions";

const ok = { allowed: true, code: null, message: null, eligibleUntil: null };
const no = (code: string, message: string) => ({
  allowed: false,
  code,
  message,
  eligibleUntil: null,
});
const opts = (
  returns: AfterSalesOptions["returns"],
  exchanges: AfterSalesOptions["exchanges"],
): AfterSalesOptions => ({
  orderId: "o1",
  orderNumber: "N1",
  signedIn: false,
  returns,
  exchanges,
});

describe("resolveAfterSalesActions", () => {
  it("falls back to the order status while the answer is loading", () => {
    expect(resolveAfterSalesActions(undefined, true)).toEqual({
      canReturn: true,
      canExchange: true,
      notes: [],
    });
    expect(resolveAfterSalesActions(undefined, false).notes).toEqual([NOT_SHIPPED_MESSAGE]);
  });

  it("shows only what the market allows, with the reason for the other", () => {
    const r = resolveAfterSalesActions(
      opts(ok, no("EXCHANGES_DISABLED", "Online exchanges aren't available.")),
      true,
    );
    expect(r).toEqual({
      canReturn: true,
      canExchange: false,
      notes: ["Online exchanges aren't available for this order. Please contact customer service and we'll help you."],
    });
  });

  it("shows one note when both are blocked for the same reason", () => {
    const msg = "Sign in to your account.";
    const r = resolveAfterSalesActions(
      opts(no("AFTER_SALES_SIGN_IN_REQUIRED", msg), no("AFTER_SALES_SIGN_IN_REQUIRED", msg)),
      true,
    );
    expect(r).toEqual({
      canReturn: false,
      canExchange: false,
      notes: ["Sign in to your account to request a return or an exchange."],
    });
  });

  it("uses friendly wording for order-state blocks", () => {
    const r = resolveAfterSalesActions(
      opts(no("ORDER_NOT_ELIGIBLE", "Order is not eligible…"), no("ORDER_NOT_ELIGIBLE", "x")),
      false,
    );
    expect(r.notes).toEqual([NOT_SHIPPED_MESSAGE]);
  });

  it("words every reason in the shopper's language by its code, with the last day when closed", () => {
    const closed = { ...no("RETURN_WINDOW_CLOSED", "The return period ended on 2026-12-04."), eligibleUntil: "2026-12-04T19:59:59.000Z" };
    const r = resolveAfterSalesActions(opts(closed, ok), true, undefined, () => "4 December 2026");
    expect(r.notes).toEqual([
      "The return period for this order ended on 4 December 2026. Please contact customer service and we'll help you.",
    ]);
  });

  it("says when everything is already in a return or exchange", () => {
    const r = resolveAfterSalesActions(
      opts(no("NOTHING_LEFT_TO_REQUEST", "x"), no("NOTHING_LEFT_TO_REQUEST", "x")),
      true,
    );
    expect(r).toEqual({
      canReturn: false,
      canExchange: false,
      notes: ["Everything on this order is already in a return or exchange."],
    });
  });

  it("falls back to the backend's sentence for a code it does not know yet", () => {
    expect(resolveAfterSalesActions(opts(no("SOMETHING_NEW", "A new reason."), ok), true).notes).toEqual(["A new reason."]);
  });
});
