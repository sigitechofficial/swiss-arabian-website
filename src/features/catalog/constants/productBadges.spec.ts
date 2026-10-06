import { describe, expect, it } from "vitest";
import { badgeForProduct, shopperBadgeFromTags } from "./productBadges";

describe("shopperBadgeFromTags", () => {
  it("maps best sellers over new when both exist", () => {
    expect(
      shopperBadgeFromTags(["New Launch", "best sellers", "perfume"]),
    ).toBe("Best Seller");
  });

  it("maps new-launch variants", () => {
    expect(shopperBadgeFromTags(["New Launches"])).toBe("New");
    expect(shopperBadgeFromTags(["new-launch"])).toBe("New");
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
    expect(shopperBadgeFromTags(["perfume-best-sellers"])).toBe("Best Seller");
    expect(shopperBadgeFromTags(["perfume-best-sellers"], "perfume")).toBe("Best Seller");
    expect(shopperBadgeFromTags(["perfume-best-sellers"], "cities")).toBeNull();
    expect(shopperBadgeFromTags(["best sellers"], "cities")).toBe("Best Seller");
  });
});

describe("badgeForProduct", () => {
  it("uses tags when the array is provided, even if empty", () => {
    expect(badgeForProduct({ tags: [], slug: "vanilla-01" })).toBeNull();
  });

  it("falls back to static slugs only when tags are omitted", () => {
    expect(badgeForProduct({ slug: "vanilla-01" })).toBe("New");
  });
});
