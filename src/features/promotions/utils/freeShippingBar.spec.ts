import { describe, expect, it } from "vitest";
import { freeShippingProgress } from "./freeShippingBar";

describe("freeShippingProgress", () => {
  it("fills toward the MIN_ORDER shipping offer", () => {
    const result = freeShippingProgress({
      subtotal: 150,
      offers: [
        {
          title: "Free shipping over AED 300",
          campaignCode: "SHIP_FREE_300",
          rejected: { reason: "MIN_ORDER", minOrderAmount: "300" },
        },
      ],
      snapshot: null,
    });
    expect(result.threshold).toBe(300);
    expect(result.isFree).toBe(false);
    expect(result.progress).toBe(0.5);
    expect(result.remaining).toBe(150);
  });

  it("derives threshold from remainingAmount + subtotal", () => {
    const result = freeShippingProgress({
      subtotal: 100,
      offers: [
        {
          title: "Free shipping over AED 300",
          qualification: { remainingAmount: "200.00", minOrderAmount: "300.00" },
        },
      ],
      snapshot: null,
    });
    expect(result.threshold).toBe(300);
    expect(result.progress).toBeCloseTo(100 / 300);
    expect(result.remaining).toBe(200);
  });

  it("unlocks when merchandise crosses the threshold even if shipping is not quoted", () => {
    const result = freeShippingProgress({
      subtotal: 320,
      offers: [
        {
          title: "Free shipping over AED 300",
          campaignCode: "SHIP_FREE_300",
          selected: false,
          rejected: { reason: "SHIPPING_NOT_QUOTED" },
        },
      ],
      snapshot: null,
    });
    expect(result.isFree).toBe(true);
    expect(result.progress).toBe(1);
  });
});
