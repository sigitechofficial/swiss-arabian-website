import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";

const previewCancelItems = vi.hoisted(() => vi.fn());
vi.mock("@/features/account/api/customerOrders.service", () => ({ previewCancelItems }));
// No waiting in tests: the selection is asked about at once.
vi.mock("@/hooks/useDebounce", () => ({ useDebounce: <T,>(value: T) => value }));

import { useCancelItemsSelection } from "./useCancelItemsSelection";

const lines = [
  { orderLineId: "a", name: "Royale Oud", quantity: 2, unitPrice: 120 },
  { orderLineId: "b", name: "Musk", quantity: 1, unitPrice: 80 },
];

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

describe("useCancelItemsSelection", () => {
  beforeEach(() => {
    previewCancelItems.mockReset();
  });

  it("keeps each pick between 0 and the line's quantity", () => {
    const { result } = renderHook(() => useCancelItemsSelection("o1", lines), { wrapper });
    act(() => result.current.change("a", 2, -1));
    expect(result.current.selected("a")).toBe(0);
    act(() => {
      result.current.change("a", 2, 1);
      result.current.change("a", 2, 1);
      result.current.change("a", 2, 1);
    });
    expect(result.current.selected("a")).toBe(2);
    expect(result.current.items).toEqual([{ orderLineId: "a", quantity: 2 }]);
  });

  it("asks the server what the pick would refund before confirm is allowed", async () => {
    previewCancelItems.mockResolvedValue({ wholeOrder: false, refundAmount: "120" });
    const { result } = renderHook(() => useCancelItemsSelection("o1", lines), { wrapper });
    expect(result.current.canConfirm).toBe(false);
    act(() => result.current.change("b", 1, 1));
    await waitFor(() => expect(result.current.canConfirm).toBe(true));
    expect(previewCancelItems).toHaveBeenCalledWith("o1", [{ orderLineId: "b", quantity: 1 }]);
    expect(result.current.preview).toMatchObject({ refundAmount: "120" });
  });

  it("shows the server's reason when it refuses the pick, and blocks confirm", async () => {
    previewCancelItems.mockRejectedValue(
      new ApiClientError(422, { code: "ORDER_PARTIAL_CANCEL_INVALID_ITEMS", message: "Keep at least one item." }),
    );
    const { result } = renderHook(() => useCancelItemsSelection("o1", lines), { wrapper });
    act(() => result.current.change("a", 2, 1));
    await waitFor(() => expect(result.current.error).toBe("Keep at least one item."));
    expect(result.current.canConfirm).toBe(false);
  });
});
