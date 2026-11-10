import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/catalogPage", () => ({
  catalogMetadata: vi.fn(),
  resolveServerCatalogMarket: vi.fn(),
}));
vi.mock("@/lib/api/apiClient", () => ({ apiGet: vi.fn() }));

import { robotsFromText } from "./pageSeo";

describe("robotsFromText", () => {
  it("returns null when the admin allows indexing", () => {
    expect(robotsFromText(undefined)).toBeNull();
    expect(robotsFromText("index, follow")).toBeNull();
  });

  it("maps noindex / nofollow", () => {
    expect(robotsFromText("noindex, follow")).toEqual({
      index: false,
      follow: true,
    });
    expect(robotsFromText("NOINDEX,NOFOLLOW")).toEqual({
      index: false,
      follow: false,
    });
    expect(robotsFromText("index, nofollow")).toEqual({
      index: true,
      follow: false,
    });
  });
});
