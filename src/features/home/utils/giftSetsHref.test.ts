import { describe, expect, it } from "vitest";
import { giftSetsHref } from "./giftSetsHref";

describe("giftSetsHref", () => {
  it("takes the market's gift sets collection from its menu", () => {
    expect(
      giftSetsHref([
        { href: "/collections/perfumes" },
        { href: "/collections/sawalef-collection-with-giftsets" },
        { href: "/collections/giftsets-gifts" },
      ]),
    ).toBe("/collections/giftsets-gifts");
    expect(giftSetsHref([{ href: "/collections/gifting-collection" }])).toBe(
      "/collections/gifting-collection",
    );
  });

  it("falls back to all collections (never a missing collection)", () => {
    expect(giftSetsHref([])).toBe("/collections");
    expect(giftSetsHref([{ href: "/products/gift-card-250" }])).toBe("/collections");
  });
});
