import { describe, expect, it } from "vitest";
import { marketLinkUrl, parseMarketLink } from "./marketLink";
import { marketForCountry, marketSiteForVisitor, servedHere, type SiteInfo } from "./siteRegistry";

describe("market links on the shared address (/~KWT/…)", () => {
  it("reads the market and the page", () => {
    expect(parseMarketLink("/~KWT/ar/account/orders/12")).toEqual({
      zoneCode: "KWT",
      path: "/ar/account/orders/12",
    });
    expect(parseMarketLink("/~KWT")).toEqual({ zoneCode: "KWT", path: "/" });
    expect(parseMarketLink("/~kwt/")).toEqual({ zoneCode: "kwt", path: "/" });
  });

  it("ignores every other path (pages, internal trees, odd codes)", () => {
    expect(parseMarketLink("/ar/account")).toBeNull();
    expect(parseMarketLink("/swissarabian.com~KWT/en/x")).toBeNull();
    expect(parseMarketLink("/~")).toBeNull();
    expect(parseMarketLink("/~K%20W/x")).toBeNull();
    expect(parseMarketLink("/~KWTproducts")).toEqual({ zoneCode: "KWTproducts", path: "/" });
  });

  it("writes the link the backend writes", () => {
    expect(marketLinkUrl("https://swissarabian.com", "KWT")).toBe("https://swissarabian.com/~KWT");
    expect(
      marketLinkUrl("https://swissarabian.com/", "KWT", {
        pathname: "/ar/products/oud",
        search: "?size=50",
        hash: "#reviews",
      }),
    ).toBe("https://swissarabian.com/~KWT/ar/products/oud?size=50#reviews");
  });
});

describe("which markets the shared address serves", () => {
  const site = (over: Partial<SiteInfo> = {}): SiteInfo => ({
    host: "swissarabian.com",
    brandCode: "SWISS_ARABIAN",
    storefrontCode: "sa_web",
    sharedSiteUrl: "https://swissarabian.com",
    siteMarketCode: null,
    defaultMarketCode: "URD1",
    markets: [
      { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en"] },
      { zoneCode: "KWT", countryCode: "KW", storefrontUrl: null, onSharedAddress: true, languages: ["en"] },
      { zoneCode: "QAT", countryCode: "QA", storefrontUrl: null, languages: ["en"] },
    ],
    ...over,
  });

  it("serves a market without a website of its own; never on a market website", () => {
    expect(servedHere(site(), "kwt")).toBe(true);
    expect(servedHere(site(), "URD1")).toBe(false);
    // An older backend (no onSharedAddress) or a market whose own address is pending.
    expect(servedHere(site(), "QAT")).toBe(false);
    expect(servedHere(site({ siteMarketCode: "URD1" }), "KWT")).toBe(false);
  });

  it("keeps such a market's visitors here and sends the rest on", () => {
    expect(marketSiteForVisitor(site(), { zoneCode: "KWT", country: "AE" })).toBeNull();
    expect(marketSiteForVisitor(site(), { country: "KW" })).toBeNull();
    expect(marketSiteForVisitor(site(), { zoneCode: "QAT", country: "QA" })).toBe(
      "https://uae.swissarabian.com",
    );
    expect(marketSiteForVisitor(site(), {})).toBe("https://uae.swissarabian.com");
  });

  it("a market website suggests the country's market when the shared address serves it", () => {
    const uae = site({ host: "uae.swissarabian.com", siteMarketCode: "URD1" });
    expect(marketForCountry(uae, "KW")).toBe("KWT");
    expect(marketForCountry({ ...uae, sharedSiteUrl: null }, "KW")).toBeNull();
    expect(marketForCountry(uae, "QA")).toBeNull();
  });
});
