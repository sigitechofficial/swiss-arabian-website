import { describe, expect, it } from "vitest";
import { searchCatalog } from "./searchCatalog";

describe("searchCatalog", () => {
  it("ranks product-name prefixes first (predictive)", () => {
    const hits = searchCatalog("shag");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.title.toLowerCase()).toContain("shaghaf");
  });

  it("finds a product when the name is slightly misspelled", () => {
    const hits = searchCatalog("shagaf oud ahmer");
    expect(hits.some((p) => p.slug === "shaghaf-oud-ahmar")).toBe(true);
  });

  it("matches vanilla through a common typo", () => {
    const hits = searchCatalog("vanila");
    expect(hits.some((p) => p.slug === "vanilla-01")).toBe(true);
  });

  it("returns nothing for an empty query", () => {
    expect(searchCatalog("")).toEqual([]);
  });
});
