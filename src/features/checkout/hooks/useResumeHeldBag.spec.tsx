import { StrictMode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  returnToCheckout: vi.fn(),
  getActiveCart: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: state.replace, push: vi.fn() }) }));
vi.mock("../utils/returnToCheckout", () => ({
  returnToCheckout: (orderId: string) => state.returnToCheckout(orderId),
}));
vi.mock("@/providers/MarketProvider", () => ({
  useOptionalMarket: () => ({ catalogContext: { zoneCode: "URD1" } }),
}));
vi.mock("@/features/cart/api/cart.service", () => ({
  getActiveCart: () => state.getActiveCart(),
}));

import { useCartStore } from "@/stores/useCartStore";
import { useResumeHeldBag } from "./useResumeHeldBag";

const heldCart = (orderId: string) => ({
  cartId: "cart-1",
  status: "AWAITING_PAYMENT",
  pendingPayment: {
    orderId,
    orderNumber: `URD1-${orderId}`,
    totalAmount: "116.00",
    currencyCode: "AED",
    paymentDueAt: null,
  },
  context: {},
  items: [],
  itemCount: 0,
  totalQuantity: "0",
  subtotalEstimate: "0",
  discountEstimate: "0",
  taxEstimate: "0",
  shippingEstimate: "0",
  totalEstimate: "0",
  currency: "AED",
  validation: null,
  updatedAt: "2026-11-17T00:00:00Z",
  metadata: null,
});

/** Checkout QA-006: the server's bag state decides, for every payment method. */
describe("useResumeHeldBag", () => {
  beforeEach(() => {
    state.replace.mockReset();
    state.returnToCheckout.mockReset();
    state.getActiveCart.mockReset();
    useCartStore.getState().clear();
  });

  it("does nothing when no unpaid order holds the bag", async () => {
    state.getActiveCart.mockResolvedValue({ ...heldCart("x"), status: "ACTIVE", pendingPayment: null });
    const { result } = renderHook(() => useResumeHeldBag());
    await waitFor(() => expect(result.current).toBe(false));
    expect(state.returnToCheckout).not.toHaveBeenCalled();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("releases the order and gives the bag back; checkout waits meanwhile", async () => {
    state.getActiveCart.mockResolvedValue(heldCart("order-1"));
    let resolveRelease: (v: unknown) => void = () => {};
    state.returnToCheckout.mockReturnValue(new Promise((r) => (resolveRelease = r)));
    const { result } = renderHook(() => useResumeHeldBag());
    await waitFor(() => expect(state.returnToCheckout).toHaveBeenCalledWith("order-1"));
    // While releasing, the store knows the bag is held (checkout start waits).
    expect(useCartStore.getState().pendingPayment?.orderId).toBe("order-1");
    resolveRelease({ kind: "checkout" });
    await waitFor(() => expect(result.current).toBe(false));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("opens the confirmation when the payment went through after all", async () => {
    state.getActiveCart.mockResolvedValue(heldCart("order-2"));
    state.returnToCheckout.mockResolvedValue({ kind: "paid" });
    renderHook(() => useResumeHeldBag());
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith(expect.stringContaining("/order-confirmation/order-2")),
    );
  });

  it("opens Pay again for the order when the platform keeps it", async () => {
    state.getActiveCart.mockResolvedValue(heldCart("order-3"));
    state.returnToCheckout.mockResolvedValue({ kind: "kept" });
    renderHook(() => useResumeHeldBag());
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith(
        expect.stringContaining("/checkout/payment/cancel?orderId=order-3"),
      ),
    );
  });

  it("opens Pay again when the platform can't be reached, never an empty checkout", async () => {
    state.getActiveCart.mockResolvedValue(heldCart("order-4"));
    state.returnToCheckout.mockRejectedValue(new Error("offline"));
    renderHook(() => useResumeHeldBag());
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith(
        expect.stringContaining("/checkout/payment/cancel?orderId=order-4"),
      ),
    );
  });

  it("asks once even when checkout mounts twice (React strict mode)", async () => {
    state.getActiveCart.mockResolvedValue(heldCart("order-5"));
    state.returnToCheckout.mockResolvedValue({ kind: "kept" });
    renderHook(() => useResumeHeldBag(), { wrapper: StrictMode });
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith(
        expect.stringContaining("/checkout/payment/cancel?orderId=order-5"),
      ),
    );
    expect(state.returnToCheckout).toHaveBeenCalledTimes(1);
  });
});
