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

  it("does not call a pending shipping offer free before the server applies it", () => {
    const result = freeShippingProgress({
      subtotal: 320,
      offers: [
        {
          title: "Free shipping over AED 300",
          campaignCode: "SHIP_FREE_300",
          selected: false,
          qualification: { status: "PENDING", pendingReason: "SHIPPING_METHOD_REQUIRED" },
          rejected: { reason: "SHIPPING_METHOD_REQUIRED" },
        },
      ],
      snapshot: null,
    });
    expect(result.isFree).toBe(false);
  });

  it("marks free shipping only when the server applied FREE_SHIPPING", () => {
    const result = freeShippingProgress({
      subtotal: 320,
      offers: [],
      snapshot: {
        v: 1,
        computedAt: null,
        context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        applied: [
          {
            kind: "FREE_SHIPPING",
            code: "SHIP",
            label: "Free shipping",
            discountType: "FREE_SHIPPING",
            discountValue: null,
            level: "SHIPPING",
            amount: "100.00",
          },
        ],
        lineAllocations: [],
        totals: { discountTotal: "0", shippingDiscount: "100.00" },
        rejected: [],
      },
    });
    expect(result.isFree).toBe(true);
    expect(result.progress).toBe(1);
  });
});
