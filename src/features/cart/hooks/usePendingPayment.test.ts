import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { usePendingPayment } from "./usePendingPayment";

describe("usePendingPayment", () => {
  beforeEach(() => useCartStore.setState({ pendingPayment: null }));

  it("is empty when no unpaid order holds the bag", () => {
    expect(renderHook(() => usePendingPayment()).result.current).toBeNull();
  });

  it("gives the order number and the link back into its payment", () => {
    useCartStore.setState({
      pendingPayment: { orderId: "ord 1/2", orderNumber: "SA-1001", totalAmount: "120.00", currencyCode: "AED", expiresAt: null },
    } as never);
    expect(renderHook(() => usePendingPayment()).result.current).toEqual({
      orderNumber: "SA-1001",
      href: "/checkout/payment/cancel?orderId=ord%201%2F2",
    });
  });
});
