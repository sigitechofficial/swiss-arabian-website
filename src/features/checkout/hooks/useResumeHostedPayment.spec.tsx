import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  returnToCheckout: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: state.replace, push: vi.fn() }) }));
vi.mock("../utils/returnToCheckout", () => ({
  returnToCheckout: (orderId: string) => state.returnToCheckout(orderId),
}));

import { getHostedPaymentOpen, storeHostedPaymentOpen } from "../utils/checkoutSession";
import { useResumeHostedPayment } from "./useResumeHostedPayment";

describe("useResumeHostedPayment (browser Back from Tabby / Telr)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    state.replace.mockReset();
    state.returnToCheckout.mockReset();
  });

  it("does nothing when no hosted payment page was opened", () => {
    const { result } = renderHook(() => useResumeHostedPayment());
    expect(result.current).toBe(false);
    expect(state.returnToCheckout).not.toHaveBeenCalled();
  });

  it("gives the bag back for an unpaid order and clears the note", async () => {
    storeHostedPaymentOpen("order-1");
    state.returnToCheckout.mockResolvedValue({ kind: "checkout" });
    const { result } = renderHook(() => useResumeHostedPayment());
    await waitFor(() => expect(state.returnToCheckout).toHaveBeenCalledWith("order-1"));
    await waitFor(() => expect(result.current).toBe(false));
    expect(getHostedPaymentOpen()).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("opens the confirmation when the payment went through after all", async () => {
    storeHostedPaymentOpen("order-2");
    state.returnToCheckout.mockResolvedValue({ kind: "paid" });
    renderHook(() => useResumeHostedPayment());
    await waitFor(() =>
      expect(state.replace).toHaveBeenCalledWith(expect.stringContaining("/order-confirmation/order-2")),
    );
  });

  it("leaves the order alone when the platform keeps it (payment still open)", async () => {
    storeHostedPaymentOpen("order-3");
    state.returnToCheckout.mockResolvedValue({ kind: "kept" });
    const { result } = renderHook(() => useResumeHostedPayment());
    await waitFor(() => expect(state.returnToCheckout).toHaveBeenCalled());
    await waitFor(() => expect(result.current).toBe(false));
    expect(state.replace).not.toHaveBeenCalled();
  });
});
