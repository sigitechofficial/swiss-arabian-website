import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { bundleTags } from "../utils/bundleTags";

const setQuantityOptimistic = vi.hoisted(() => vi.fn());
const removeItemOptimistic = vi.hoisted(() => vi.fn());

vi.mock("../api/optimisticCart", () => ({ setQuantityOptimistic, removeItemOptimistic }));
vi.mock("@/features/promotions/hooks/useApplicablePromotions", () => ({
  useApplicablePromotions: () => ({ data: undefined }),
}));
vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => ({ currencyCode: "AED" }),
}));

import { isRemoteLine, useBag } from "./useBag";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: new QueryClient() }, children);
}

const local: CartLine = { variantId: "v-local", slug: "a", title: "A", unitPrice: 50, currency: "AED", quantity: 1 };
const remote: CartLine = { ...local, variantId: "v-remote", cartItemId: "ci-1", remote: true, quantity: 2 };

describe("useBag", () => {
  beforeEach(() => {
    setQuantityOptimistic.mockReset();
    removeItemOptimistic.mockReset();
    useCartStore.setState({ lines: [local, remote], totals: null, syncing: false, validation: null, promotions: null });
  });

  it("tells server-backed lines from local ones", () => {
    expect(isRemoteLine(remote)).toBe(true);
    expect(isRemoteLine(local)).toBe(false);
  });

  it("changes quantities through the API for remote lines and locally otherwise", () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    act(() => result.current.setLineQuantity(remote, 3));
    expect(setQuantityOptimistic).toHaveBeenCalledWith("v-remote", 3);
    act(() => result.current.setLineQuantity(local, 4));
    expect(setQuantityOptimistic).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().lines.find((l) => l.variantId === "v-local")?.quantity).toBe(4);
  });

  it("removes remote lines through the API and local lines from the store", () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    act(() => result.current.removeLine(remote));
    expect(removeItemOptimistic).toHaveBeenCalledWith("v-remote");
    act(() => result.current.removeLine(local));
    expect(useCartStore.getState().lines.some((l) => l.variantId === "v-local")).toBe(false);
  });

  it("blocks checkout while syncing or when a line can't be sold", () => {
    useCartStore.setState({ syncing: true });
    expect(renderHook(() => useBag(), { wrapper }).result.current.checkoutBlocked).toBe(true);
    useCartStore.setState({ syncing: false, lines: [{ ...remote, isSellable: false }] });
    const { result } = renderHook(() => useBag(), { wrapper });
    expect(result.current.checkoutBlocked).toBe(true);
    expect(result.current.allUnavailable).toBe(true);
  });

  it("falls back to the subtotal for the amount due without a server quote", () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    expect(result.current.amountDue).toBe(150);
    expect(result.current.currency).toBe("AED");
  });
});

describe("bundleTags", () => {
  it("splits a bundle label and emphasises the saving", () => {
    expect(bundleTags("Bundle of 3 · 20% off")).toEqual([
      { text: "Bundle of 3", strong: false },
      { text: "20% off", strong: true },
    ]);
    expect(bundleTags(null)).toEqual([]);
  });
});
