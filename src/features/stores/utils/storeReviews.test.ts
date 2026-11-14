import { describe, expect, it } from "vitest";
import { reviewMonth, shownReviews } from "./storeReviews";

const review = (id: string, text: string | null) => ({ id, author: null, rating: 5, text, createdAt: null, reply: null });

describe("store reviews", () => {
  it("shows the newest reviews that have words, in Google's order", () => {
    const reviews = [review("a", "Great"), review("b", null), review("c", "  "), review("d", "Nice"), review("e", "Kind"), review("f", "Late")];
    expect(shownReviews({ reviews }).map((r) => r.id)).toEqual(["a", "d", "e"]);
    expect(shownReviews({})).toEqual([]);
  });

  it("month and year in the page language", () => {
    expect(reviewMonth("2026-11-10T09:00:00Z", "en-AE")).toBe("November 2026");
    expect(reviewMonth("2026-11-10T09:00:00Z", "ar-AE")).toMatch(/نوفمبر/);
    expect(reviewMonth(null, "en")).toBe("");
    expect(reviewMonth("not a date", "en")).toBe("");
  });
});
