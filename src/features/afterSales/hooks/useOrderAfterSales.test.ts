import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  options: undefined as unknown,
  returns: { data: undefined as unknown },
  exchanges: { data: undefined as unknown },
}));
vi.mock("./useAfterSales", () => ({
  useCustomerReturnsFeed: () => h.returns,
  useCustomerExchangesFeed: () => h.exchanges,
  useCustomerAfterSalesOptions: () => ({ data: h.options }),
  useGuestReturns: () => h.returns,
  useGuestExchanges: () => h.exchanges,
  useGuestAfterSalesOptions: () => ({ data: h.options }),
}));

import { useGuestOrderAfterSales, useOrderAfterSales } from "./useOrderAfterSales";

const allowed = {
  returns: { allowed: true, code: null, message: null, eligibleUntil: "2026-12-04T19:59:59.000Z" },
  exchanges: { allowed: false, code: "EXCHANGES_OFF", message: "Exchanges are not offered.", eligibleUntil: "2026-12-10T19:59:59.000Z" },
};

beforeEach(() => {
  h.options = undefined;
  h.returns = { data: undefined };
  h.exchanges = { data: undefined };
});

describe("useOrderAfterSales", () => {
  it("offers what the market allows, says why not, until when, and lists the order's requests", () => {
    h.options = allowed;
    h.returns = { data: { pages: [{ items: [{ returnRequestId: "r1" }] }, { items: [{ returnRequestId: "r2" }] }] } };
    const { result } = renderHook(() => useOrderAfterSales({ orderId: "o1", status: "DELIVERED", fulfillmentStatus: "FULFILLED" }));
    expect(result.current).toMatchObject({
      canStart: true,
      canReturn: true,
      canExchange: false,
      notes: ["Exchanges are not offered."],
      // Only a deadline of something offered counts.
      eligibleUntil: "2026-12-04T19:59:59.000Z",
      flowHref: "/account/orders/o1/return",
    });
    expect(result.current.returnItems.map((r) => (r as { returnRequestId: string }).returnRequestId)).toEqual(["r1", "r2"]);
  });
});

describe("useGuestOrderAfterSales", () => {
  it("links a guest to the flow on the tracking page (the token stays in the browser)", () => {
    h.options = allowed;
    const { result } = renderHook(() =>
      useGuestOrderAfterSales({ orderNumber: "SA-1", orderAccessToken: "tok", status: "DELIVERED" }),
    );
    expect(result.current).toMatchObject({ canStart: true, flowHref: "/track/SA-1/return" });
    expect(result.current.flowHref).not.toContain("tok");
  });
});
