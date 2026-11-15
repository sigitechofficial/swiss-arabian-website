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
      notes: ["Online exchanges aren't available."],
    });
  });

  it("shows one note when both are blocked for the same reason", () => {
    const msg = "Sign in to your account.";
    const r = resolveAfterSalesActions(
      opts(no("AFTER_SALES_SIGN_IN_REQUIRED", msg), no("AFTER_SALES_SIGN_IN_REQUIRED", msg)),
      true,
    );
    expect(r).toEqual({ canReturn: false, canExchange: false, notes: [msg] });
  });

  it("uses friendly wording for order-state blocks", () => {
    const r = resolveAfterSalesActions(
      opts(no("ORDER_NOT_ELIGIBLE", "Order is not eligible…"), no("ORDER_NOT_ELIGIBLE", "x")),
      false,
    );
    expect(r.notes).toEqual([NOT_SHIPPED_MESSAGE]);
  });
});
