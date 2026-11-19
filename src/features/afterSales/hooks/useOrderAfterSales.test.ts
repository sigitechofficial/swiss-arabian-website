import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  options: undefined as unknown,
  returns: { data: undefined as unknown },
  exchanges: { data: undefined as unknown },
  storedLines: [] as unknown[],
}));
vi.mock("./useAfterSales", () => ({
  useCustomerReturnsFeed: () => h.returns,
  useCustomerExchangesFeed: () => h.exchanges,
  useCustomerAfterSalesOptions: () => ({ data: h.options }),
  useGuestReturns: () => h.returns,
  useGuestExchanges: () => h.exchanges,
  useGuestAfterSalesOptions: () => ({ data: h.options }),
}));
vi.mock("@/features/checkout/utils/checkoutSession", () => ({ getStoredGuestOrderLines: () => h.storedLines }));

import { useGuestOrderAfterSales, useOrderAfterSales } from "./useOrderAfterSales";

const lines = [{ orderLineId: "l1", sku: "RO", productName: "Royale Oud", variantName: null, quantity: 1 }];
const allowed = { returns: { allowed: true, code: null, message: null }, exchanges: { allowed: false, code: "EXCHANGES_OFF", message: "Exchanges are not offered." } };

beforeEach(() => {
  h.options = undefined;
  h.returns = { data: undefined };
  h.exchanges = { data: undefined };
  h.storedLines = [];
});

describe("useOrderAfterSales", () => {
  it("offers what the market allows, says why not, and lists the order's requests", () => {
    h.options = allowed;
    h.returns = { data: { pages: [{ items: [{ returnRequestId: "r1" }] }, { items: [{ returnRequestId: "r2" }] }] } };
    const { result } = renderHook(() => useOrderAfterSales({ orderId: "o1", status: "DELIVERED", fulfillmentStatus: "FULFILLED", lines }));
    expect(result.current).toMatchObject({ canReturn: true, canExchange: false, notes: ["Exchanges are not offered."] });
    expect(result.current.returnItems.map((r) => (r as { returnRequestId: string }).returnRequestId)).toEqual(["r1", "r2"]);
    act(() => result.current.setForm("return"));
    expect(result.current.form).toBe("return");
  });

  it("offers nothing without order lines", () => {
    h.options = allowed;
    const { result } = renderHook(() => useOrderAfterSales({ orderId: "o1", status: "DELIVERED", lines: [] }));
    expect(result.current.canReturn).toBe(false);
  });
});

describe("useGuestOrderAfterSales", () => {
  it("falls back to this browser's checkout lines, and says when it has none", () => {
    h.options = allowed;
    h.storedLines = lines;
    const withStored = renderHook(() =>
      useGuestOrderAfterSales({ orderNumber: "SA-1", orderAccessToken: "tok", status: "DELIVERED", lines: [] }),
    ).result.current;
    expect(withStored).toMatchObject({ canReturn: true, noLines: false, lines });

    h.storedLines = [];
    const without = renderHook(() =>
      useGuestOrderAfterSales({ orderNumber: "SA-1", orderAccessToken: "tok", status: "DELIVERED", lines: [] }),
    ).result.current;
    expect(without).toMatchObject({ canReturn: false, noLines: true });
  });
});
