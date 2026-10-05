import { describe, expect, it } from "vitest";
import { badgeForProduct, readPromotionDiscovery } from "./discovery";

describe("promotion discovery reader", () => {
  it("keeps server copy and ignores internal fields", () => {
    const discovery = readPromotionDiscovery({
      entryLabel: "Exclusive offers · 2 available",
      marketCode: "URD1",
      offers: [
        {
          campaignId: "1",
          campaignCode: "SET25",
          mechanic: "SET_BUNDLE",
          publicTitle: "Complete the Set & Save 25%",
          badge: "Set & Save 25%",
          shortMessage: "Pick one qualifying item from each part of the set.",
          benefitSummary: "Save 25% when you complete the set.",
          qualificationSummary: "Choose Perfume, Deodorant.",
          shopOfferAvailable: true,
          shopOfferPath: "/offers/SET25",
          details: {
            whatYouGet: "25% off the pieces that complete the set.",
            howToQualify: "Add Perfume, Deodorant.",
            restrictions: ["The saving applies when the set is complete."],
            ctaLabel: "Build your set",
          },
          groups: [{ name: "Perfume", quantity: 1 }],
          targetType: "CATEGORY",
          stackingClass: "PRODUCT",
        },
      ],
      productBadges: [{ productId: "men", campaignCode: "SET25", badge: "Set & Save 25%", publicTitle: "Complete the Set & Save 25%" }],
    });
    expect(discovery.offers[0]?.publicTitle).toBe("Complete the Set & Save 25%");
    expect(discovery.offers[0]).not.toHaveProperty("targetType");
    expect(badgeForProduct(discovery, "men")?.badge).toBe("Set & Save 25%");
    expect(badgeForProduct(discovery, "other")).toBeNull();
    expect(discovery.offers[0]?.lines).toEqual([]);
  });

  it("keeps tile ladder lines and drops blanks", () => {
    const discovery = readPromotionDiscovery({
      tiles: [
        {
          campaignCode: "LADDER",
          publicTitle: "Spend more, save more",
          mechanic: "TIERED_SPEND",
          lines: ["Spend AED 300, save 10%.", " ", "Spend AED 500, save 15%."],
        },
      ],
    });
    expect(discovery.tiles[0]?.lines).toEqual([
      "Spend AED 300, save 10%.",
      "Spend AED 500, save 15%.",
    ]);
    expect(JSON.stringify(discovery.tiles)).not.toMatch(/targetType|Customers also bought/);
  });
});