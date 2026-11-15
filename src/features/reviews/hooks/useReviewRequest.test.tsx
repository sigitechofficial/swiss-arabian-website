import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";

const state = vi.hoisted(() => ({ search: "" }));
const api = vi.hoisted(() => ({
  fetchReviewRequest: vi.fn(),
  submitReviewRequestReview: vi.fn(),
  unsubscribeReviewEmails: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.search) }));
vi.mock("../api/reviewRequests.service", () => api);

import { useReviewRequest, useReviewRequestCard } from "./useReviewRequest";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const view = {
  orderNumber: "SP-1",
  firstName: "Ana",
  displayName: "Ana K.",
  expired: false,
  expiresAt: "2026-12-13T00:00:00Z",
  unsubscribed: false,
  products: [
    { productId: "a", name: "A", slug: "a", image: null, review: null },
    { productId: "b", name: "B", slug: "b", image: null, review: null },
  ],
};

beforeEach(() => {
  state.search = "";
  for (const fn of Object.values(api)) fn.mockReset();
});

describe("useReviewRequest", () => {
  it("puts the product tapped in the email first with its star pre-selected", async () => {
    state.search = "p=b&r=4";
    api.fetchReviewRequest.mockResolvedValue(view);
    const { result } = renderHook(() => useReviewRequest("tok"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.products.map((p) => p.productId)).toEqual(["b", "a"]);
    expect(result.current.initialRatingFor("b")).toBe(4);
    expect(result.current.initialRatingFor("a")).toBe(0);
  });

  it("stops the emails once for ?unsubscribe=1 and reports a failure", async () => {
    state.search = "unsubscribe=1";
    api.fetchReviewRequest.mockResolvedValue(view);
    api.unsubscribeReviewEmails.mockRejectedValue(new Error("x"));
    const onUnsubscribeFailed = vi.fn();
    const { rerender } = renderHook(() => useReviewRequest("tok", { onUnsubscribeFailed }), { wrapper });
    rerender();
    await waitFor(() => expect(onUnsubscribeFailed).toHaveBeenCalledTimes(1));
    expect(api.unsubscribeReviewEmails).toHaveBeenCalledTimes(1);
  });

  it("tells a dead link (404) from a failed load", async () => {
    api.fetchReviewRequest.mockRejectedValue(new ApiClientError(404, "gone"));
    const { result } = renderHook(() => useReviewRequest("tok"), { wrapper });
    await waitFor(() => expect(result.current.errorKind).toBe("notFound"));
  });
});

describe("useReviewRequestCard", () => {
  const product = view.products[0];

  it("asks for a rating before posting", async () => {
    const { result } = renderHook(
      () => useReviewRequestCard({ token: "tok", product, displayName: "Ana", initialRating: 0, onDone: vi.fn() }),
      { wrapper },
    );
    expect(await result.current.submit()).toBe("needsRating");
    expect(api.submitReviewRequestReview).not.toHaveBeenCalled();
  });

  it("posts trimmed text and reports live / pending", async () => {
    api.submitReviewRequestReview.mockResolvedValue({ reviewId: "r", status: "PENDING" });
    const onDone = vi.fn();
    const { result } = renderHook(
      () => useReviewRequestCard({ token: "tok", product, displayName: "Ana", initialRating: 5, onDone }),
      { wrapper },
    );
    act(() => result.current.setTitle("  Lovely  "));
    let outcome = "";
    await act(async () => {
      outcome = await result.current.submit();
    });
    expect(outcome).toBe("posted");
    expect(api.submitReviewRequestReview).toHaveBeenCalledWith("tok", {
      productId: "a",
      rating: 5,
      title: "Lovely",
      body: undefined,
      displayName: "Ana",
    });
    expect(result.current.posted).toBe("pending");
    expect(result.current.done).toBe("pending");
    expect(onDone).toHaveBeenCalled();
  });

  it("maps a 409 to 'already'", async () => {
    api.submitReviewRequestReview.mockRejectedValue(new ApiClientError(409, "dup"));
    const { result } = renderHook(
      () => useReviewRequestCard({ token: "tok", product, displayName: "Ana", initialRating: 3, onDone: vi.fn() }),
      { wrapper },
    );
    let outcome = "";
    await act(async () => {
      outcome = await result.current.submit();
    });
    expect(outcome).toBe("already");
  });
});
