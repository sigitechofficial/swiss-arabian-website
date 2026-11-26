import { describe, expect, it } from "vitest";
import {
  marketLinkUrl,
  marketPagePath,
  marketPrefixOf,
  parseMarketLink,
  withoutMarketSegment,
} from "./marketLink";
import { localePrefixOf, localizeHref, stripLocalePrefix } from "@/lib/i18n/localePath";
import { languageSwitchPath } from "@/hooks/useLanguageSwitch";
import { fallbackLocaleConfig } from "@/lib/i18n/locales";
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

describe("pages of a market on the shared address keep its segment", () => {
  const config = fallbackLocaleConfig();

  it("reads the segment, the language after it, and the bare page", () => {
    expect(marketPrefixOf("/~KWT/ar/x")).toBe("/~KWT");
    expect(marketPrefixOf("/ar/x")).toBe("");
    expect(withoutMarketSegment("/~KWT/ar/x")).toBe("/ar/x");
    expect(localePrefixOf("/~KWT/ar/x")).toBe("ar");
    expect(stripLocalePrefix("/~KWT/ar/products/oud")).toBe("/products/oud");
    expect(marketPagePath("KWT", "/")).toBe("/~KWT");
    expect(marketPagePath("KWT", "/ar/cart")).toBe("/~KWT/ar/cart");
  });

  it("links keep the market's segment and the page's language", () => {
    expect(localizeHref("/collections", "/~KWT/ar/products/oud", config)).toBe("/~KWT/ar/collections");
    expect(localizeHref("/cart?x=1#top", "/~KWT/products/oud", config)).toBe("/~KWT/cart?x=1#top");
    expect(localizeHref("/", "/~KWT/ar", config)).toBe("/~KWT/ar");
    // Payment returns stay unprefixed in language, never leave the market.
    expect(localizeHref("/payments/tabby/return", "/~KWT/ar/checkout", config)).toBe(
      "/~KWT/payments/tabby/return",
    );
    // Already another market's address, or a page outside the shared address: as given.
    expect(localizeHref("/~QAT/collections", "/~KWT/ar", config)).toBe("/~QAT/collections");
    expect(localizeHref("/collections", "/ar/products/oud", config)).toBe("/ar/collections");
  });

  it("switching language stays in the market", () => {
    expect(languageSwitchPath("/~KWT/ar/products/oud", "en", config)).toBe("/~KWT/products/oud");
    expect(languageSwitchPath("/~KWT/products/oud", "ar", config)).toBe("/~KWT/ar/products/oud");
    expect(languageSwitchPath("/~KWT/products/oud", "en", config)).toBeNull();
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

  it("serves a market without a website of its own; on a market website only when it is the main address", () => {
    expect(servedHere(site(), "kwt")).toBe(true);
    expect(servedHere(site(), "URD1")).toBe(false);
    // An older backend (no onSharedAddress) or a market whose own address is pending.
    expect(servedHere(site(), "QAT")).toBe(false);
    // Another market's website (uae.): never.
    expect(servedHere(site({ host: "uae.swissarabian.com", siteMarketCode: "URD1" }), "KWT")).toBe(false);
    // The main address that is a market's own website (swissarabian.com for GLOBAL): yes.
    expect(servedHere(site({ siteMarketCode: "GLOBAL" }), "KWT")).toBe(true);
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
