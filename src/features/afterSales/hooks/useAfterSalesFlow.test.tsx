import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";

const h = vi.hoisted(() => ({
  options: {
    orderId: "o1",
    orderNumber: "SA-1",
    signedIn: true,
    returns: { allowed: true, code: null, message: null, eligibleUntil: "2026-12-04T19:59:59.000Z" },
    exchanges: { allowed: false, code: "EXCHANGES_OFF", message: "Exchanges are not offered.", eligibleUntil: null },
  } as unknown,
  lines: [] as unknown[],
  returnEstimate: { data: undefined as unknown, empty: true, updating: false, error: null as unknown },
  createReturn: vi.fn(),
  createGuestReturn: vi.fn(),
}));

vi.mock("@/lib/i18n/useShopCopy", () => ({ useShopCopy: () => (key: string) => key }));
vi.mock("./useAfterSales", () => ({
  useCustomerAfterSalesOptions: () => ({ data: h.options, isLoading: false }),
  useGuestAfterSalesOptions: () => ({ data: h.options, isLoading: false }),
  useAfterSalesEligibility: (_t: unknown, kind: string | null) => ({
    data: kind ? { lines: h.lines, eligibleUntil: null } : undefined,
    isLoading: false,
    error: null,
  }),
  useExchangeOptions: () => ({ data: undefined, isLoading: false }),
  useReturnEstimate: () => h.returnEstimate,
  useExchangeEstimate: () => ({ data: undefined, empty: true, updating: false, error: null }),
  useAfterSalesMutations: () => ({
    createReturn: { mutateAsync: h.createReturn, isPending: false },
    createExchange: { mutateAsync: vi.fn(), isPending: false },
    createGuestReturn: { mutateAsync: h.createGuestReturn, isPending: false },
    createGuestExchange: { mutateAsync: vi.fn(), isPending: false },
  }),
}));

import { useAfterSalesFlow } from "./useAfterSalesFlow";

const customer = { mode: "customer" as const, orderId: "o1" };

beforeEach(() => {
  sessionStorage.clear();
  h.lines = [
    { orderLineId: "l1", sku: "OUD", productName: "Oud", variantName: null, orderedQty: 2, isGift: false, imageUrl: null, returnableQty: 2 },
    { orderLineId: "g1", sku: "MINI", productName: "Mini", variantName: null, orderedQty: 1, isGift: true, imageUrl: null, returnableQty: 1 },
  ];
  h.returnEstimate = { data: undefined, empty: true, updating: false, error: null };
  h.createReturn.mockReset();
  h.createGuestReturn.mockReset();
});

function walkToReview(result: { current: ReturnType<typeof useAfterSalesFlow> }) {
  act(() => result.current.choose("return"));
  act(() => result.current.next());
  act(() => result.current.toggleLine("l1", true));
  act(() => result.current.next());
  act(() => result.current.setReason("DAMAGED_ITEM"));
  act(() => result.current.next());
}

describe("useAfterSalesFlow", () => {
  it("offers what the market allows, says why not, and walks the steps in order", () => {
    const { result } = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    expect(result.current.choices).toEqual([
      { kind: "return", allowed: true, note: null, eligibleUntil: "2026-12-04T19:59:59.000Z" },
      { kind: "exchange", allowed: false, note: "Exchanges are not offered.", eligibleUntil: null },
    ]);
    expect(result.current.step).toBe("choose");
    expect(result.current.canContinue).toBe(false);
    // Continue does nothing until the step is complete.
    act(() => result.current.next());
    expect(result.current.step).toBe("choose");
    walkToReview(result);
    expect(result.current.step).toBe("review");
    // The step list goes back, never forward.
    act(() => result.current.goTo("items"));
    expect(result.current.step).toBe("items");
    act(() => result.current.goTo("review"));
    expect(result.current.step).toBe("items");
  });

  it("starts over when the shopper switches between return and exchange", () => {
    const { result } = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en", initialKind: "return" }));
    expect(result.current.step).toBe("items");
    act(() => result.current.toggleLine("l1", true));
    act(() => result.current.choose("exchange"));
    expect(result.current.draft).toMatchObject({ kind: "exchange", quantities: {} });
  });

  it("asks for the free gift when the market needs it back, then lets the return go", async () => {
    h.returnEstimate = {
      data: { giftRequirement: { required: true, code: "RETURN_GIFT_REQUIRED", message: null, gifts: [{ orderLineId: "g1" }] } },
      empty: false,
      updating: false,
      error: null,
    };
    const { result } = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    walkToReview(result);
    expect(result.current.giftRequired).toBe(true);
    expect(result.current.canContinue).toBe(false);
    await act(async () => {
      await result.current.submit();
    });
    expect(h.createReturn).not.toHaveBeenCalled();
    act(() => result.current.addRequiredGifts());
    expect(result.current.draft.quantities.g1).toBe(1);
    expect(result.current.giftRequired).toBe(false);
  });

  it("sends the return and shows what was created", async () => {
    h.createReturn.mockResolvedValue({ returnRequestId: "r1", returnNumber: "RN-1", status: "APPROVED" });
    const { result } = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    walkToReview(result);
    await act(async () => {
      await result.current.submit();
    });
    expect(h.createReturn).toHaveBeenCalledWith({
      orderId: "o1",
      dto: expect.objectContaining({ items: [{ orderLineId: "l1", quantity: 1 }], reasonCode: "DAMAGED_ITEM", requestedResolution: "REFUND" }),
    });
    expect(result.current.result).toEqual({ kind: "return", requestId: "r1", requestNumber: "RN-1", status: "APPROVED" });
  });

  it("sends a guest's return with the order's access token, and explains a refusal", async () => {
    h.createGuestReturn.mockRejectedValue(
      new ApiClientError(404, { code: "ORDER_NOT_FOUND", message: "We couldn’t find this order." }),
    );
    const { result } = renderHook(() =>
      useAfterSalesFlow({ target: { mode: "guest", orderNumber: "SA-1", orderAccessToken: "tok" }, locale: "en" }),
    );
    walkToReview(result);
    await act(async () => {
      await result.current.submit();
    });
    expect(h.createGuestReturn).toHaveBeenCalledWith(expect.objectContaining({ orderNumber: "SA-1", orderAccessToken: "tok" }));
    expect(result.current.submitError).toBe("We couldn’t find this order.");
    expect(result.current.result).toBeNull();
  });

  it("a reload keeps the request being put together, and sending clears it", async () => {
    const first = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    walkToReview(first.result);
    first.unmount();

    const again = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    expect(again.result.current.step).toBe("review");
    expect(again.result.current.draft).toMatchObject({ kind: "return", quantities: { l1: 1 }, reasonCode: "DAMAGED_ITEM" });

    h.createReturn.mockResolvedValue({ returnRequestId: "r1", returnNumber: "RN-1", status: "REQUESTED" });
    await act(async () => {
      await again.result.current.submit();
    });
    again.unmount();
    const after = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    expect(after.result.current.step).toBe("choose");
  });

  it("never resumes past a step that is no longer complete (the item is gone)", () => {
    const first = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    walkToReview(first.result);
    first.unmount();
    h.lines = [{ ...(h.lines[0] as object), returnableQty: 0, blockedReason: "QTY_EXCEEDED" }];
    const again = renderHook(() => useAfterSalesFlow({ target: customer, locale: "en" }));
    expect(again.result.current.step).toBe("items");
  });
});
