import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { useBagPaymentConfirming } from "./useBagPaymentConfirming";

const held = { orderId: "o1", orderNumber: "SA-1001", totalAmount: "120.00", currencyCode: "AED", paymentDueAt: null };

describe("useBagPaymentConfirming", () => {
  beforeEach(() => useCartStore.setState({ pendingPayment: null }));

  it("says nothing for an ordinary bag", () => {
    expect(renderHook(() => useBagPaymentConfirming()).result.current).toBe(false);
  });

  it("says nothing when the shopper only didn't finish paying", () => {
    useCartStore.setState({ pendingPayment: { ...held, paymentConfirming: false } });
    expect(renderHook(() => useBagPaymentConfirming()).result.current).toBe(false);
  });

  it("says so while a payment is being confirmed", () => {
    useCartStore.setState({ pendingPayment: { ...held, paymentConfirming: true } });
    expect(renderHook(() => useBagPaymentConfirming()).result.current).toBe(true);
  });
});
