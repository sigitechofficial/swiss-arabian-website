import { describe, expect, it } from "vitest";
import { analyticsSiteFields } from "@/components/layout/AnalyticsScripts";
import { marketPageUrl, marketSiteUrl } from "./marketSiteUrl";

const here = (pathname: string, search = "", hash = "") => ({
  origin: "https://uae.swissarabian.com",
  pathname,
  search,
  hash,
});

describe("switching market goes to that market's website", () => {
  const ksa = { storefrontUrl: "https://ksa.swissarabian.com" };

  it("keeps the page, language, query and anchor", () => {
    expect(marketSiteUrl(ksa, here("/ar/products/oud", "?size=50", "#reviews"))).toBe(
      "https://ksa.swissarabian.com/ar/products/oud?size=50#reviews",
    );
    expect(marketSiteUrl(ksa, here("/"))).toBe("https://ksa.swissarabian.com/");
  });

  it("checkout and order pages land on that market's bag", () => {
    expect(marketSiteUrl(ksa, here("/ar/checkout", "?step=2"))).toBe("https://ksa.swissarabian.com/ar/cart");
    expect(marketSiteUrl(ksa, here("/order-confirmation/123"))).toBe("https://ksa.swissarabian.com/cart");
  });

  it("stays put for this website or a market without its own website", () => {
    expect(marketSiteUrl({ storefrontUrl: "https://uae.swissarabian.com" }, here("/"))).toBeNull();
    expect(marketSiteUrl({ storefrontUrl: null }, here("/"))).toBeNull();
    expect(marketSiteUrl({ storefrontUrl: "not a url" }, here("/"))).toBeNull();
  });
});

describe("switching to a market the brand's shared address serves", () => {
  const kwt = { zoneCode: "KWT", storefrontUrl: null, onSharedAddress: true };
  const SHARED = "https://swissarabian.com";

  it("from a market website: the shared address opened in that market, same page", () => {
    expect(marketPageUrl(kwt, SHARED, here("/ar/products/oud", "?size=50"))).toBe(
      "https://swissarabian.com/~KWT/ar/products/oud?size=50",
    );
    expect(marketPageUrl(kwt, SHARED, here("/checkout"))).toBe("https://swissarabian.com/~KWT/cart");
  });

  it("on the shared address itself, or with no shared address, the switch happens on the page", () => {
    expect(marketPageUrl(kwt, SHARED, { ...here("/"), origin: SHARED })).toBeNull();
    expect(marketPageUrl(kwt, null, here("/"))).toBeNull();
    expect(marketPageUrl({ ...kwt, onSharedAddress: false }, SHARED, here("/"))).toBeNull();
  });

  it("a market with a website of its own still goes there", () => {
    expect(
      marketPageUrl({ zoneCode: "KSA", storefrontUrl: "https://ksa.swissarabian.com" }, SHARED, here("/")),
    ).toBe("https://ksa.swissarabian.com/");
  });
});

describe("analytics site context", () => {
  it("names website, market, country, currency and language (empty values left out)", () => {
    expect(
      analyticsSiteFields({
        siteHost: "ksa.swissarabian.com",
        market: "KSA",
        country: "SA",
        currency: "SAR",
        language: "ar",
      }),
    ).toEqual({
      site_host: "ksa.swissarabian.com",
      market: "KSA",
      market_country: "SA",
      currency: "SAR",
      site_language: "ar",
    });
    expect(analyticsSiteFields({ siteHost: null, market: null, country: null, currency: null, language: "en" })).toEqual({
      site_language: "en",
    });
    expect(analyticsSiteFields(undefined)).toEqual({});
  });
});

describe("locally, market websites map to their local aliases", () => {
  it("public address → configured *.localhost alias on the same port", async () => {
    const { localSiteUrl } = await import("@/lib/storefront/localStorefront");
    const aliases = "sa=SWISS_ARABIAN@uae.swissarabian.com,ksa=SWISS_ARABIAN@ksa.swissarabian.com";
    expect(
      localSiteUrl("https://ksa.swissarabian.com/", "http://sa.localhost:3004", { appEnv: "local", aliases }),
    ).toBe("http://ksa.localhost:3004/");
    // Not local, no alias, or not on a local address: unchanged.
    expect(
      localSiteUrl("https://ksa.swissarabian.com/", "http://sa.localhost:3004", { appEnv: "production", aliases }),
    ).toBe("https://ksa.swissarabian.com/");
    expect(
      localSiteUrl("https://qa.swissarabian.com/", "http://sa.localhost:3004", { appEnv: "local", aliases }),
    ).toBe("https://qa.swissarabian.com/");
    expect(
      localSiteUrl("https://ksa.swissarabian.com/", "https://uae.swissarabian.com", { appEnv: "local", aliases }),
    ).toBe("https://ksa.swissarabian.com/");
  });
});
