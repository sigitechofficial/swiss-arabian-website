import { describe, expect, it } from "vitest";
import { amountPayableFrom, giftCardSignature, parseGiftCardTender, visibleGiftCards } from "./promotions";
import type { PromotionSnapshotV1 } from "./promotions";

const snapshot = {
  v: 1,
  computedAt: null,
  context: { brandCode: "SA", zoneCode: "UAE", currencyCode: "AED", salesChannelCode: "platform_uae" },
  applied: [],
  lineAllocations: [],
  totals: { discountTotal: "0.00", amountPayable: "80.00" },
  rejected: [],
  giftCards: [{ usageId: "u1", maskedCode: "••••XM", amount: "50.00" }],
} satisfies PromotionSnapshotV1;

describe("gift card snapshot helpers", () => {
  it("reads tender rows and skips empty objects", () => {
    expect(visibleGiftCards(snapshot)).toEqual([
      {
        usageId: "u1",
        maskedCode: "••••XM",
        amount: "50.00",
        remainingBalance: null,
        currencyCode: null,
        status: null,
      },
    ]);
    expect(parseGiftCardTender({})).toBeNull();
  });

  it("uses server amountPayable and does not subtract the gift card", () => {
    expect(amountPayableFrom(snapshot)).toBe(80);
    expect(giftCardSignature(snapshot)).toBe("u1:50.00");
  });
});
