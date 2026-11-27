import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("@/components/ui/Toaster", () => ({ toast: (...args: unknown[]) => toast(...args) }));
vi.mock("../api/optimisticCart", () => ({ addItemOptimistic: vi.fn() }));

import { useUiStore } from "@/stores/useUiStore";
import { useAddToCart } from "./useAddToCart";

describe("useAddToCart", () => {
  beforeEach(() => {
    toast.mockReset();
    useUiStore.getState().setCartOpen(false);
  });

  it("keeps the bag closed and shows an Added to your bag message with a View bag button", async () => {
    const { result } = renderHook(() => useAddToCart());
    await act(() => result.current.addToCart({ sku: "SKU-1", title: "Oud" }));

    expect(useUiStore.getState().cartOpen).toBe(false);
    expect(toast).toHaveBeenCalledTimes(1);
    const [message, tone, action] = toast.mock.calls[0];
    expect(message).toBe("Added to your bag");
    expect(tone).toBe("success");
    expect(action.label).toBe("View bag");

    act(() => action.onClick());
    expect(useUiStore.getState().cartOpen).toBe(true);
  });

  it("shows no message when the bag is already open (the new line appears in it)", async () => {
    useUiStore.getState().setCartOpen(true);
    const { result } = renderHook(() => useAddToCart());
    await act(() => result.current.addToCart({ sku: "SKU-1" }));
    expect(toast).not.toHaveBeenCalled();
    expect(useUiStore.getState().cartOpen).toBe(true);
  });
});
