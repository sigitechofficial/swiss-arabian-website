import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StorefrontPdpReviews, StorefrontPublicReview } from "../types/pdpReviews";
import { usePdpReviewList } from "./usePdpReviewList";

const fetchProductReviews = vi.hoisted(() => vi.fn());
vi.mock("../api/reviews.service", () => ({ fetchProductReviews }));
vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => ({ zoneCode: "URD1", salesChannelCode: "web" }),
}));
vi.mock("@/lib/api/toastApiError", () => ({ toastApiError: vi.fn() }));

const review = (id: string): StorefrontPublicReview => ({
  reviewId: id,
  rating: 5,
  title: null,
  body: "Lovely",
  displayName: "Noura",
  verifiedPurchase: true,
  createdAt: "2026-10-01",
  helpfulCount: 0,
  reply: null,
  photos: [],
  variant: null,
});

const payload = {
  summary: { productId: "p1", averageRating: 4.8, reviewCount: 6, ratingBreakdown: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 5 }, verifiedPurchaseCount: 6 },
  items: [review("a"), review("b"), review("c"), review("d")],
  total: 6,
  limit: 4,
  offset: 0,
  sort: "useful",
  display: { marketOnly: true, showVerifiedBadge: true, showReplies: true, minReviewsToShowStars: 1 },
} as StorefrontPdpReviews;

describe("usePdpReviewList", () => {
  it("shows the first row from the payload and loads more only when needed", async () => {
    fetchProductReviews.mockResolvedValueOnce({ items: [review("e"), review("f")], total: 6, limit: 24, offset: 4 });
    const { result } = renderHook(() => usePdpReviewList("p1", payload, { firstRow: 2, nextRow: 4 }));
    expect(result.current.visible.map((r) => r.reviewId)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(true);
    await act(async () => {
      await result.current.viewMore();
    });
    expect(fetchProductReviews).toHaveBeenCalledWith("p1", expect.objectContaining({ offset: 4 }), expect.anything());
    expect(result.current.visible.map((r) => r.reviewId)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("reports a failed load to onError", async () => {
    const onError = vi.fn();
    fetchProductReviews.mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => usePdpReviewList("p1", payload, { firstRow: 2, nextRow: 4, onError }));
    await act(async () => {
      result.current.applyFilters({ rating: 5 });
    });
    expect(onError).toHaveBeenCalled();
    expect(result.current.starFilter).toBe(5);
  });
});
