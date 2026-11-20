import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";

const markReviewHelpful = vi.hoisted(() => vi.fn());
const reportReview = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("../api/reviews.service", () => ({ markReviewHelpful, reportReview }));
vi.mock("@/lib/i18n/useLocaleRouter", () => ({ useLocaleRouter: () => ({ push }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/products/royale-oud" }));

import { useReviewActions } from "./useReviewActions";

const review = { reviewId: "r1", helpfulCount: 2 } as Parameters<typeof useReviewActions>[0];

describe("useReviewActions", () => {
  beforeEach(() => {
    markReviewHelpful.mockReset();
    reportReview.mockReset();
    push.mockReset();
  });

  it("sends a guest to sign in and back to the reviews", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = renderHook(() => useReviewActions(review, { anchor: "reviews", onError: vi.fn() }));
    await act(() => result.current.toggleHelpful());
    expect(markReviewHelpful).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(`/login?returnTo=${encodeURIComponent("/products/royale-oud#reviews")}`);
  });

  it("marks and unmarks helpful, using the server's count", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    markReviewHelpful.mockResolvedValueOnce(3).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useReviewActions(review, { anchor: "reviews", onError: vi.fn() }));
    await act(() => result.current.toggleHelpful());
    expect(markReviewHelpful).toHaveBeenLastCalledWith("r1", true);
    expect(result.current).toMatchObject({ marked: true, count: 3 });
    // No count from the server: one less, locally.
    await act(() => result.current.toggleHelpful());
    expect(markReviewHelpful).toHaveBeenLastCalledWith("r1", false);
    expect(result.current).toMatchObject({ marked: false, count: 2 });
  });

  it("reports once confirmed and tells the page; failures go to onError", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    const onReported = vi.fn();
    const onError = vi.fn();
    reportReview.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useReviewActions(review, { anchor: "reviews", onError, onReported }));
    act(() => result.current.setConfirming(true));
    await act(() => result.current.sendReport());
    expect(result.current).toMatchObject({ reported: true, confirming: false });
    expect(onReported).toHaveBeenCalledOnce();

    markReviewHelpful.mockRejectedValueOnce(new Error("down"));
    await act(() => result.current.toggleHelpful());
    expect(onError).toHaveBeenCalledOnce();
    expect(result.current.busy).toBe(false);
  });
});
