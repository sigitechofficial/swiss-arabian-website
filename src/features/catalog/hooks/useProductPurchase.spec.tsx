import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/stores/useCartStore";
import type { ProductSummary } from "../types/product";
import { useProductPurchase } from "./useProductPurchase";

const addToCart = vi.hoisted(() => vi.fn());
const setQuantityOptimistic = vi.hoisted(() => vi.fn());
const updateQuantity = vi.hoisted(() => vi.fn());

vi.mock("@/features/cart", () => ({
  useAddToCart: () => ({ addToCart }),
  setQuantityOptimistic,
}));
vi.mock("@/stores/useCartStore", () => ({
  useCartStore: (select: (s: { updateQuantity: typeof updateQuantity }) => unknown) =>
    select({ updateQuantity }),
}));

const product: ProductSummary = {
  id: "p1",
  slug: "berry-crush",
  title: "Berry Crush",
  price: 63,
  currency: "AED",
  sku: "SKU1",
  variantId: "v1",
  isSellable: true,
  inStock: true,
};

beforeEach(() => {
  addToCart.mockReset();
  setQuantityOptimistic.mockReset();
  updateQuantity.mockReset();
});

describe("useProductPurchase", () => {
  it("picks 1…9 before the product is in the bag and adds that many", () => {
    const { result } = renderHook(() => useProductPurchase(product, undefined));
    expect(result.current.displayQty).toBe(1);
    expect(result.current.canDecrease).toBe(false);
    act(() => result.current.increase());
    act(() => result.current.increase());
    expect(result.current.displayQty).toBe(3);
    act(() => result.current.setDisplayQuantity(40));
    expect(result.current.displayQty).toBe(9);
    let outcome: ReturnType<typeof result.current.add> | undefined;
    act(() => {
      outcome = result.current.add();
    });
    expect(outcome).toEqual({ status: "added", quantity: 9 });
    expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ variantId: "v1", quantity: 9 }));
  });

  it("edits the bag line once the product is in the bag", () => {
    const line: CartLine = { variantId: "v1", slug: "berry-crush", title: "Berry Crush", unitPrice: 63, currency: "AED", quantity: 2, remote: true };
    const { result } = renderHook(() => useProductPurchase(product, line));
    expect(result.current.displayQty).toBe(2);
    act(() => result.current.increase());
    expect(setQuantityOptimistic).toHaveBeenCalledWith("v1", 3);
    act(() => result.current.decrease());
    expect(setQuantityOptimistic).toHaveBeenCalledWith("v1", 1);
  });

  it("refuses to add past the stock limit", () => {
    const line: CartLine = { variantId: "v1", slug: "berry-crush", title: "Berry Crush", unitPrice: 63, currency: "AED", quantity: 2, maxQuantity: 2 };
    const { result } = renderHook(() => useProductPurchase(product, line));
    expect(result.current.canIncrease).toBe(false);
    expect(result.current.add()).toEqual({ status: "full", maxQuantity: 2 });
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("asks for a stock alert when the product can't be bought", () => {
    const { result } = renderHook(() => useProductPurchase({ ...product, inStock: false }, undefined));
    expect(result.current.needsAlert).toBe(true);
    expect(result.current.unavailable).toBe(false);
    const { result: noPrice } = renderHook(() => useProductPurchase({ ...product, price: null }, undefined));
    expect(noPrice.current.unavailable).toBe(true);
  });
});
