import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  poll: vi.fn(),
  startPayment: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, push: mocks.push }) }));
vi.mock("../api/orders.service", () => ({ pollUntilPaymentSettles: mocks.poll }));
vi.mock("../utils/checkoutSession", () => ({
  clearPaymentState: mocks.clear,
  getStoredOrderId: () => "stored-order",
  getStoredOrderNumber: () => "SP-1001",
  getStoredPaymentMethodId: () => "pm",
  getStoredPaymentProviderCode: () => "stripe",
  getStoredZonePaymentMethodId: () => "zpm",
  incrementPayAttempt: vi.fn(),
  storeOrderId: vi.fn(),
}));
vi.mock("../utils/startPayment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/startPayment")>()),
  startPayment: mocks.startPayment,
}));

import { PaymentGatewayError } from "../utils/startPayment";
import { usePaymentRetry, useSettlePayment } from "./usePaymentReturn";

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
});

describe("useSettlePayment", () => {
  it("waits without an order, then polls once and opens the confirmation when paid", async () => {
    mocks.poll.mockResolvedValue({ success: true, status: "PAID" });
    const { result, rerender } = renderHook(({ id }) => useSettlePayment(id), { initialProps: { id: null as string | null } });
    expect(mocks.poll).not.toHaveBeenCalled();
    rerender({ id: "o1" });
    await waitFor(() => expect(result.current).toEqual({ kind: "paid" }));
    rerender({ id: "o1" });
    expect(mocks.poll).toHaveBeenCalledTimes(1);
    expect(mocks.clear).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/order-confirmation/o1");
  });

  it("reports a terminal failure or a timeout without redirecting", async () => {
    mocks.poll.mockResolvedValue({ success: false, status: "DECLINED" });
    const failed = renderHook(() => useSettlePayment("o2"));
    await waitFor(() => expect(failed.result.current).toEqual({ kind: "failed", status: "DECLINED" }));
    mocks.poll.mockResolvedValue({ success: false, status: "TIMEOUT" });
    const timeout = renderHook(() => useSettlePayment("o3"));
    await waitFor(() => expect(timeout.result.current).toEqual({ kind: "timeout" }));
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe("usePaymentRetry", () => {
  it("uses the stored order's methods and its number", async () => {
    mocks.startPayment.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePaymentRetry({ queryOrderId: null, storedOrderId: "stored-order", gatewayReason: false }));
    expect(result.current.orderNumber).toBe("SP-1001");
    await act(() => result.current.retry());
    expect(mocks.startPayment).toHaveBeenCalledWith("stored-order", expect.any(Function), {
      zonePaymentMethodId: "zpm",
      paymentMethodId: "pm",
      providerCode: "stripe",
    });
  });

  it("opens with the gateway error and classifies retry failures", async () => {
    const { result } = renderHook(() => usePaymentRetry({ queryOrderId: "other", storedOrderId: "stored-order", gatewayReason: true }));
    expect(result.current.error).toEqual({ kind: "gateway" });
    expect(result.current.orderNumber).toBeNull();
    mocks.startPayment.mockRejectedValue(new PaymentGatewayError());
    await act(() => result.current.retry());
    expect(mocks.startPayment).toHaveBeenCalledWith("other", expect.any(Function), {});
    expect(result.current.error).toEqual({ kind: "gateway" });
    mocks.startPayment.mockRejectedValue(new Error("boom"));
    await act(() => result.current.retry());
    expect(result.current.error).toEqual({ kind: "other", message: null });
    expect(result.current.retrying).toBe(false);
  });
});
