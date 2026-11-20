import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiPost = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/apiClient", () => ({ apiPost }));
vi.mock("@/lib/storefront/context", () => ({ storefrontContextQuery: () => "zone=AE" }));

import { useStockAlert } from "./useStockAlert";

const product = { id: "p1", title: "Royale Oud", slug: "royale-oud", sku: "RO-100", variantId: "v1" };

describe("useStockAlert", () => {
  beforeEach(() => {
    apiPost.mockReset();
  });

  it("saves the email against the product in the shopper's market", async () => {
    apiPost.mockResolvedValue({});
    const { result } = renderHook(() => useStockAlert(product));
    act(() => result.current.setEmail("a@example.com"));
    await act(() => result.current.submit());
    expect(apiPost).toHaveBeenCalledWith(
      "/storefront/catalog/stock-alerts?zone=AE",
      { productId: "p1", variantId: "v1", sku: "RO-100", productName: "Royale Oud", slug: "royale-oud", email: "a@example.com" },
      { skipAuth: true },
    );
    expect(result.current.done).toBe(true);
    expect(result.current.error).toBe("");
  });

  it("says when the product can't take an alert, without calling the API", async () => {
    const { result } = renderHook(() => useStockAlert({ ...product, sku: undefined }));
    await act(() => result.current.submit());
    expect(apiPost).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/cannot take an alert/i);
  });

  it("shows a translated failure and stays open to try again", async () => {
    apiPost.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useStockAlert(product));
    await act(() => result.current.submit());
    expect(result.current.done).toBe(false);
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toMatch(/couldn't save that email/i);
  });
});
