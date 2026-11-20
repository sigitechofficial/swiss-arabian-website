import { describe, expect, it } from "vitest";
import { badgeForProduct, shopperBadgeFromTags } from "./productBadges";

describe("shopperBadgeFromTags", () => {
  it("maps best sellers over new when both exist", () => {
    expect(
      shopperBadgeFromTags(["New Launch", "best sellers", "perfume"]),
    ).toBe("bestSeller");
  });

  it("maps new-launch variants", () => {
    expect(shopperBadgeFromTags(["New Launches"])).toBe("new");
    expect(shopperBadgeFromTags(["new-launch"])).toBe("new");
  });

  it("ignores ops and category tags", () => {
    expect(
      shopperBadgeFromTags([
        "a-grade",
        "d365-translation-added",
        "not for sale",
        "30%",
        "perfume",
        "Gifting Collection",
        "sep25",
      ]),
    ).toBeNull();
  });

  it("maps collection-scoped best-seller tags", () => {
    expect(shopperBadgeFromTags(["perfume-best-sellers"])).toBe("bestSeller");
    expect(shopperBadgeFromTags(["perfume-best-sellers"], "perfume")).toBe("bestSeller");
    expect(shopperBadgeFromTags(["perfume-best-sellers"], "cities")).toBeNull();
    expect(shopperBadgeFromTags(["best sellers"], "cities")).toBe("bestSeller");
  });
});

describe("badgeForProduct", () => {
  it("uses tags when the array is provided, even if empty", () => {
    expect(badgeForProduct({ tags: [], slug: "vanilla-01" })).toBeNull();
  });

  it("falls back to static slugs only when tags are omitted", () => {
    expect(badgeForProduct({ slug: "vanilla-01" })).toBe("new");
  });
});
