import { describe, expect, it } from "vitest";
import {
  filterMarketsForTenant,
  normalizeStorefrontHost,
} from "./brand";

describe("normalizeStorefrontHost", () => {
  it("strips scheme, path, and port", () => {
    expect(normalizeStorefrontHost("https://sapil.test:3001/shop")).toBe(
      "sapil.test",
    );
  });

  it("lowercases", () => {
    expect(normalizeStorefrontHost("SAPIL.TEST")).toBe("sapil.test");
  });
});

describe("filterMarketsForTenant", () => {
  it("passes through when markets have no brandCode", () => {
    const markets = [
      { catalogContext: { brandCode: null } },
      { catalogContext: {} },
    ];
    expect(filterMarketsForTenant(markets)).toEqual(markets);
  });
});
