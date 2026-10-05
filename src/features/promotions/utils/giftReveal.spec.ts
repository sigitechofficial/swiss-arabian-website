import { describe, expect, it } from "vitest";
import { readGiftAwards } from "../types/promotions";
import { awaitingGiftChoice, nextGiftReveal } from "../utils/giftWithPurchase";

describe("gift choice reveal", () => {
  it("reads a customer-choice quote that is still typed as a gift with purchase", () => {
    const awards = readGiftAwards({
      applied: [
        {
          type: "GIFT_WITH_PURCHASE",
          code: "GWP1",
          giftSelectionMode: "CUSTOMER_CHOICE",
          giftItems: [],
          giftOptions: [
            { sku: "ROSE", quantity: 1, name: "Rose sample" },
            { sku: "OUD", quantity: 1, name: "Oud sample" },
          ],
        },
      ],
    });
    expect(awards).toHaveLength(1);
    expect(awards[0]?.type).toBe("CUSTOMER_CHOICE");
    expect(awards[0]?.selectionMode).toBe("CUSTOMER_CHOICE");
    expect(awaitingGiftChoice(awards[0]!)).toBe(true);
    expect(awards[0]?.choices.map((gift) => gift.sku)).toEqual(["ROSE", "OUD"]);
  });

  it("keeps a chosen gift as an awarded line", () => {
    const awards = readGiftAwards({
      applied: [
        {
          type: "GIFT_WITH_PURCHASE",
          code: "GWP1",
          giftSelectionMode: "CUSTOMER_CHOICE",
          giftItems: [{ sku: "ROSE", quantity: 1, unitPrice: "0.00" }],
          giftOptions: [{ sku: "ROSE", quantity: 1 }, { sku: "OUD", quantity: 1 }],
        },
      ],
    });
    expect(awaitingGiftChoice(awards[0]!)).toBe(false);
    expect(awards[0]?.giftItems.map((gift) => gift.sku)).toEqual(["ROSE"]);
    expect(awards[0]?.selectionMode).toBe("CUSTOMER_CHOICE");
  });

  it("opens once on the cart, then again only after the offer is lost", () => {
    const seen = new Set<string>();
    const first = nextGiftReveal({
      awaitingCodes: ["GWP1"],
      awardedCodes: [],
      seen,
      surfaceVisible: true,
      alreadyOpen: false,
    });
    expect(first.openCode).toBe("GWP1");
    const again = nextGiftReveal({
      awaitingCodes: ["GWP1"],
      awardedCodes: [],
      seen,
      surfaceVisible: true,
      alreadyOpen: false,
    });
    expect(again.openCode).toBeNull();
    const hidden = nextGiftReveal({
      awaitingCodes: ["GWP2"],
      awardedCodes: [],
      seen,
      surfaceVisible: false,
      alreadyOpen: false,
    });
    expect(hidden.openCode).toBeNull();
    expect(seen.has("GWP2")).toBe(false);
    nextGiftReveal({
      awaitingCodes: [],
      awardedCodes: [],
      seen,
      surfaceVisible: true,
      alreadyOpen: false,
    });
    expect(seen.has("GWP1")).toBe(false);
  });
});
