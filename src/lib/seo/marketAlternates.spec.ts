import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { fallbackLocaleConfig } from "@/lib/i18n/locales";
import { buildMarketHreflang, marketSites, pathExistsIn, type MarketSite } from "./marketAlternates";
import { sitemapXml } from "./siteSitemap";
import type { StorefrontMarketListResponse } from "@/features/markets/types/market";

const UAE: MarketSite = {
  zoneCode: "URD1",
  countryCode: "AE",
  origin: "https://uae.swissarabian.com",
  host: "uae.swissarabian.com",
  languages: ["en", "ar"],
};
const KSA: MarketSite = {
  zoneCode: "KSA",
  countryCode: "SA",
  origin: "https://ksa.swissarabian.com",
  host: "ksa.swissarabian.com",
  languages: ["en", "ar"],
};

describe("hreflang across market websites", () => {
  it("links the same page on every market website where it exists, x-default on the default market", () => {
    const languages = buildMarketHreflang({
      path: "/ar/products/oud",
      ownZoneCode: "KSA",
      defaultZoneCode: "URD1",
      sites: [UAE, KSA],
      catalogPaths: new Map([["URD1", new Set(["/products/oud"])]]),
    });
    expect(languages).toEqual({
      "en-AE": "https://uae.swissarabian.com/products/oud",
      "ar-AE": "https://uae.swissarabian.com/ar/products/oud",
      // This website's own addresses stay relative (metadataBase).
      "ar-SA": "/ar/products/oud",
      "en-SA": "/products/oud",
      "x-default": "https://uae.swissarabian.com/products/oud",
    });
  });

  it("does not name a market where the product is not sold (or its catalog cannot be read)", () => {
    const missing = buildMarketHreflang({
      path: "/products/ksa-only",
      ownZoneCode: "KSA",
      defaultZoneCode: "URD1",
      sites: [UAE, KSA],
      catalogPaths: new Map([["URD1", new Set(["/products/oud"])]]),
    });
    expect(missing).toEqual({ "ar-SA": "/ar/products/ksa-only", "en-SA": "/products/ksa-only" });
    expect(pathExistsIn("/products/oud", null)).toBe(false);
  });

  it("fixed pages exist everywhere; CMS pages stay on their own website", () => {
    expect(pathExistsIn("/", null)).toBe(true);
    expect(pathExistsIn("/collections", null)).toBe(true);
    expect(pathExistsIn("/pages/our-story", new Set(["/pages/our-story"]))).toBe(false);
  });

  it("is off when the address is not a market website or there is no other market website", () => {
    const base = { path: "/", defaultZoneCode: "URD1", catalogPaths: new Map() };
    expect(buildMarketHreflang({ ...base, ownZoneCode: "QTR", sites: [UAE, KSA] })).toBeNull();
    expect(buildMarketHreflang({ ...base, ownZoneCode: "KSA", sites: [KSA] })).toBeNull();
  });

  it("market websites come from the markets list (markets without an address are left out)", () => {
    const list = {
      markets: [
        {
          zoneCode: "KSA",
          countryCode: "sa",
          storefrontUrl: "https://ksa.swissarabian.com",
          languages: [
            { locale: "en-SA", languageCode: "en", displayName: null, isDefault: false },
            { locale: "ar-SA", languageCode: "ar", displayName: null, isDefault: true },
          ],
        },
        { zoneCode: "QTR", countryCode: "QA", storefrontUrl: null, languages: [] },
      ],
    } as unknown as StorefrontMarketListResponse;
    expect(marketSites(list)).toEqual([{ ...KSA, languages: ["ar", "en"] }]);
  });
});

describe("sitemap XML", () => {
  it("writes hreflang links and escapes addresses", () => {
    const xml = sitemapXml([
      {
        url: "https://ksa.swissarabian.com/products/a&b",
        lastModified: "2026-11-01T00:00:00.000Z",
        alternates: { languages: { "en-SA": "https://ksa.swissarabian.com/products/a&b" } },
      },
    ]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<loc>https://ksa.swissarabian.com/products/a&amp;b</loc>");
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en-SA" href="https://ksa.swissarabian.com/products/a&amp;b" />',
    );
    expect(xml).toContain("<lastmod>2026-11-01T00:00:00.000Z</lastmod>");
  });
});

describe("hreflang when a market website's default language is not English", () => {
  it("leaves that market's default unprefixed and prefixes its other languages", () => {
    const arabicKsa: MarketSite = { ...KSA, languages: ["ar", "en"] };
    const languages = buildMarketHreflang({
      path: "/products/oud",
      ownZoneCode: "URD1",
      defaultZoneCode: "KSA",
      sites: [UAE, arabicKsa],
      catalogPaths: new Map([["KSA", new Set(["/products/oud"])]]),
    });
    expect(languages).toEqual({
      "en-AE": "/products/oud",
      "ar-AE": "/ar/products/oud",
      "ar-SA": "https://ksa.swissarabian.com/products/oud",
      "en-SA": "https://ksa.swissarabian.com/en/products/oud",
      "x-default": "https://ksa.swissarabian.com/products/oud",
    });
  });
});

describe("market website languages follow each market (any language)", () => {
  const market = (zoneCode: string, languages: Array<{ locale: string; isDefault: boolean }>) => ({
    zoneCode,
    countryCode: "fr",
    storefrontUrl: `https://${zoneCode.toLowerCase()}.example.com`,
    languages: languages.map((l) => ({ ...l, languageCode: l.locale.split("-")[0], displayName: null })),
  });

  it("a French-default market is published in French first, not English", () => {
    const list = {
      markets: [market("FRA", [{ locale: "en", isDefault: false }, { locale: "fr-FR", isDefault: true }])],
    } as unknown as StorefrontMarketListResponse;
    expect(marketSites(list)[0]!.languages).toEqual(["fr", "en"]);
  });

  it("a market with none of the website's languages uses the website fallback, not a fixed English", () => {
    const list = {
      markets: [market("DEU", [{ locale: "de", isDefault: true }])],
    } as unknown as StorefrontMarketListResponse;
    expect(marketSites(list)[0]!.languages).toEqual([...fallbackLocaleConfig().locales]);
  });
});
