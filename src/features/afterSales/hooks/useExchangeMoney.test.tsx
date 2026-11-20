import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExchangeMoneyView } from "../types/afterSales";

const api = vi.hoisted(() => ({
  requestCustomerDifferencePayment: vi.fn(),
  requestGuestDifferencePayment: vi.fn(),
  syncCustomerDifferencePayment: vi.fn(),
  syncGuestDifferencePayment: vi.fn(),
}));
vi.mock("../api/afterSales.service", () => api);
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));

import { useExchangeMoney } from "./useExchangeMoney";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

const money = (over: Partial<ExchangeMoneyView> = {}): ExchangeMoneyView => ({
  currencyCode: "AED",
  additionalPaymentRequired: true,
  refundDifferenceRequired: false,
  customerPayableAmount: "25.00",
  refundableDifferenceAmount: "0",
  action: "PAY_DIFFERENCE",
  ...over,
});

describe("useExchangeMoney", () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset();
  });

  it("is empty for an even swap", () => {
    const { result } = renderHook(() => useExchangeMoney({ exchangeRequestId: "x1", money: money({ action: "NONE" as never }) }), { wrapper });
    expect(result.current).toBeNull();
  });

  it("never offers Pay when a refund of the difference is due", () => {
    const { result } = renderHook(
      () => useExchangeMoney({ exchangeRequestId: "x1", money: money({ action: "REFUND_PENDING", refundableDifferenceAmount: "15" }) }),
      { wrapper },
    );
    expect(result.current).toMatchObject({ canPay: false });
    expect(result.current?.amount).toMatch(/15/);
  });

  it("asks the guest's order for a payment page with its access token", async () => {
    api.requestGuestDifferencePayment.mockResolvedValue({ settled: true, money: money({ action: "PAYMENT_COMPLETE" }) });
    const { result } = renderHook(
      () => useExchangeMoney({ exchangeRequestId: "x1", money: money(), guest: { orderNumber: "SA-1", orderAccessToken: "tok" } }),
      { wrapper },
    );
    expect(result.current?.payLabel).toMatch(/25/);
    await act(async () => result.current!.pay());
    expect(api.requestGuestDifferencePayment).toHaveBeenCalledWith("SA-1", "x1", expect.objectContaining({ orderAccessToken: "tok" }));
    await waitFor(() => expect(result.current?.canPay).toBe(false));
  });

  it("explains when the payment page can't be opened", async () => {
    api.requestCustomerDifferencePayment.mockResolvedValue({ settled: false, customerPayUrl: null, money: money() });
    const { result } = renderHook(() => useExchangeMoney({ exchangeRequestId: "x1", money: money() }), { wrapper });
    await act(async () => result.current!.pay());
    await waitFor(() => expect(result.current?.error).toBeTruthy());
    expect(result.current?.opening).toBe(false);
  });
});
