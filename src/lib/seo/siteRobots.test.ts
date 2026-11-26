import { describe, expect, it, vi } from "vitest";

/**
 * robots.txt of the shared address: it names its markets' sitemaps (market websites
 * and the markets it serves at `/~CODE`), and closes private pages under every
 * market segment too.
 */
vi.mock("@/lib/config/runtime", () => ({ seoIndexingEnabled: () => true }));
vi.mock("@/lib/seo/requestOrigin", () => ({ requestOrigin: async () => "https://swissarabian.com" }));
vi.mock("@/lib/seo/serverMarket", () => ({
  loadServerMarkets: async () => ({
    siteMarketCode: null,
    sharedSiteUrl: "https://swissarabian.com",
    markets: [
      { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: [] },
      { zoneCode: "KWT", countryCode: "KW", storefrontUrl: null, onSharedAddress: true, languages: [] },
      { zoneCode: "QTR", countryCode: "QA", storefrontUrl: null, onSharedAddress: false, languages: [] },
    ],
  }),
}));

import { siteRobotsTxt } from "./siteRobots";

describe("robots.txt of the shared address", () => {
  it("lists the market websites' sitemaps and those of the markets it serves at /~CODE", async () => {
    const lines = (await siteRobotsTxt()).split("\n");
    expect(lines).toContain("Sitemap: https://uae.swissarabian.com/sitemap.xml");
    expect(lines).toContain("Sitemap: https://swissarabian.com/~KWT/sitemap.xml");
    // A market whose own address is not live yet is not listed.
    expect(lines.some((line) => line.includes("QTR"))).toBe(false);
  });

  it("closes private pages under a market's segment too", async () => {
    const lines = (await siteRobotsTxt()).split("\n");
    expect(lines).toContain("Disallow: /~*/cart");
    expect(lines).toContain("Disallow: /~*/ar/checkout");
  });
});
