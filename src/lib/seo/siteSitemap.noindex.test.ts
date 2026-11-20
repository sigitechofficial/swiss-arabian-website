import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/requestOrigin", () => ({ requestOrigin: async () => "https://uae.sapil.com" }));
vi.mock("@/lib/seo/serverMarket", () => ({
  loadServerMarkets: async () => null,
  resolveCatalogMarketFor: async () => ({ zoneCode: "AE", market: null }),
}));
vi.mock("@/lib/brand/features", () => ({
  brandFeatureEnabled: (name: string) => name === "blog",
  brandLinkEnabled: () => true,
}));
vi.mock("@/features/catalog/api/catalog.service", () => ({
  fetchCatalogSitemap: async () => ({
    entries: [
      { entityType: "COLLECTION", path: "/collections/best-sellers", updatedAt: null },
      { entityType: "COLLECTION", path: "/collections/dont-miss-this", updatedAt: null, noindex: true },
      { entityType: "PRODUCT", path: "/products/royale-oud", updatedAt: null },
    ],
    noindexPaths: ["/collections/dont-miss-this", "/pages/internal-offers", "/faq", "/blog/draft-notes"],
  }),
}));
vi.mock("@/features/site-pages/api/sitePages.service", () => ({
  fetchSitePages: async () => [
    { kind: "PAGE", handle: "gift-wrapping", path: "/pages/gift-wrapping", updatedAt: "2026-11-01" },
    { kind: "PAGE", handle: "internal-offers", path: "/pages/internal-offers", updatedAt: "2026-11-01" },
  ],
}));
vi.mock("@/features/blog/api/blogApi", () => ({
  fetchBlogSlugs: async ({ languageCode }: { languageCode: string }) =>
    languageCode === "en"
      ? [
          { slug: "how-to-layer", updatedAt: "2026-11-01" },
          { slug: "draft-notes", updatedAt: "2026-11-01" },
        ]
      : [],
}));
vi.mock("@/features/stores/api/storesApi", () => ({ fetchStoreSlugs: async () => ({ stores: [], areas: [] }) }));

import { siteSitemap } from "./siteSitemap";

describe("siteSitemap and SEO Management noindex", () => {
  it("leaves out every address the admin publishes as noindex, wherever it comes from", async () => {
    const urls = (await siteSitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://uae.sapil.com/collections/best-sellers");
    expect(urls).toContain("https://uae.sapil.com/products/royale-oud");
    expect(urls).toContain("https://uae.sapil.com/pages/gift-wrapping");
    expect(urls).toContain("https://uae.sapil.com/blog/how-to-layer");
    for (const hidden of ["/collections/dont-miss-this", "/pages/internal-offers", "/faq", "/blog/draft-notes"]) {
      expect(urls.some((url) => url.endsWith(hidden))).toBe(false);
    }
  });
});
