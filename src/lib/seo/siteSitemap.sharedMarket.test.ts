import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A market without a website of its own is served by the shared address at
 * `/~KWT`: its sitemap (`/~KWT/sitemap.xml`) lists its pages there, with hreflang
 * to the other markets; the shared address's own sitemap lists nothing (it
 * redirects to its markets' addresses).
 */
const page = vi.hoisted(() => ({ own: "KWT" as string | null, base: "https://swissarabian.com/~KWT" }));

vi.mock("@/lib/seo/requestOrigin", () => ({
  requestOrigin: async () => "https://swissarabian.com",
  requestSiteBase: async () => page.base,
}));
vi.mock("@/lib/seo/serverMarket", () => ({
  loadServerMarkets: async () => ({
    siteMarketCode: null,
    sharedSiteUrl: "https://swissarabian.com",
    brandDefaultMarketCode: "URD1",
    markets: [
      {
        zoneCode: "URD1",
        countryCode: "AE",
        storefrontUrl: "https://uae.swissarabian.com",
        languages: [{ locale: "en", languageCode: "en", displayName: null, isDefault: true }],
      },
      {
        zoneCode: "KWT",
        countryCode: "KW",
        storefrontUrl: null,
        onSharedAddress: true,
        languages: [{ locale: "en", languageCode: "en", displayName: null, isDefault: true }],
      },
    ],
  }),
  pageOwnMarketCode: async () => page.own,
  resolveCatalogMarketFor: async () => ({ zoneCode: "KWT", market: null, languages: ["en"] }),
}));
vi.mock("@/lib/seo/marketAlternates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./marketAlternates")>();
  return { ...actual, catalogPathsOf: async () => new Set(["/products/oud"]) };
});
vi.mock("@/lib/brand/features", () => ({
  brandFeatureEnabled: () => false,
  brandLinkEnabled: () => true,
}));
vi.mock("@/features/catalog/api/catalog.service", () => ({
  fetchCatalogSitemap: async () => ({
    entries: [{ entityType: "PRODUCT", path: "/products/oud", updatedAt: null }],
    noindexPaths: [],
  }),
}));
vi.mock("@/features/site-pages/api/sitePages.service", () => ({ fetchSitePages: async () => [] }));
vi.mock("@/features/blog/api/blogApi", () => ({ fetchBlogSlugs: async () => [] }));
vi.mock("@/features/stores/api/storesApi", () => ({ fetchStoreSlugs: async () => ({ stores: [], areas: [] }) }));

import { siteSitemap } from "./siteSitemap";

describe("sitemap of a market on the shared address", () => {
  beforeEach(() => {
    page.own = "KWT";
    page.base = "https://swissarabian.com/~KWT";
  });

  it("lists the market's pages at their /~KWT addresses, with hreflang to the market websites", async () => {
    const entries = await siteSitemap();
    const product = entries.find((entry) => entry.url.endsWith("/products/oud"));
    expect(entries.map((entry) => entry.url)).toContain("https://swissarabian.com/~KWT");
    expect(product?.url).toBe("https://swissarabian.com/~KWT/products/oud");
    expect(product?.alternates?.languages).toMatchObject({
      "en-KW": "https://swissarabian.com/~KWT/products/oud",
      "en-AE": "https://uae.swissarabian.com/products/oud",
      "x-default": "https://uae.swissarabian.com/products/oud",
    });
  });

  it("the shared address's own sitemap lists nothing (it redirects to its markets' addresses)", async () => {
    page.own = null;
    page.base = "https://swissarabian.com";
    expect(await siteSitemap()).toEqual([]);
  });
});
