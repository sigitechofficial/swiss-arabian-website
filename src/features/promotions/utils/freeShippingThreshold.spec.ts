import { describe, expect, it } from "vitest";
import { structuredSpendAmount, unlockThresholdAmount } from "./freeShippingThreshold";

describe("free-shipping threshold", () => {
  it("prefers qualification.remainingAmount over every threshold", () => {
    expect(
      structuredSpendAmount({
        qualification: { remainingAmount: "75.00", minOrderAmount: "300.00" },
        rejected: { reason: "MIN_ORDER", remainingAmount: "40.00", minOrderAmount: "300.00" },
        eligibility: { thresholdAmount: "350.00" },
      }),
    ).toBe("75.00");
  });

  it("uses qualification.minOrderAmount before rejected amounts", () => {
    expect(
      structuredSpendAmount({
        qualification: { minOrderAmount: "280.00" },
        rejected: { reason: "MIN_ORDER", remainingAmount: "40.00", minOrderAmount: "300" },
      }),
    ).toBe("280.00");
  });

  it("uses rejected.remainingAmount before rejected.minOrderAmount", () => {
    expect(
      structuredSpendAmount({
        rejected: { reason: "MIN_ORDER", remainingAmount: "40.00", minOrderAmount: "300" },
      }),
    ).toBe("40.00");
  });

  it("falls back to rejected.minOrderAmount", () => {
    expect(
      unlockThresholdAmount({
        code: "SHIP_FREE_300",
        title: "Free shipping over AED 300",
        rejected: { reason: "MIN_ORDER", minOrderAmount: "300" },
      }),
    ).toBe("300");
  });

  it("uses a legacy explicit threshold only when structured amounts are absent", () => {
    expect(
      unlockThresholdAmount({
        rejected: { reason: "MIN_ORDER" },
        eligibility: { thresholdAmount: "350.00" },
      }),
    ).toBe("350.00");
  });

  it("does not invent a threshold from the campaign code or title", () => {
    expect(
      unlockThresholdAmount({
        code: "SHIP_FREE_300",
        title: "Free shipping over AED 300",
        rejected: { reason: "OTHER" },
      }),
    ).toBeNull();
  });

  it("does not treat a pending offer as a spend near-miss", () => {
    expect(
      unlockThresholdAmount({
        qualification: {
          status: "PENDING",
          pendingReason: "SHIPPING_METHOD_REQUIRED",
          remainingAmount: "75.00",
        },
        rejected: { reason: "MIN_ORDER", minOrderAmount: "300" },
      }),
    ).toBeNull();
  });
});
