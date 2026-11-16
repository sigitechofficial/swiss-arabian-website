import { describe, expect, it } from "vitest";
import { countryDisplayName, countryMarketSuggestion } from "./countryMarketSuggestion";
import { firstVisitMarket, marketForCountry, type SiteMarket } from "@/lib/site/siteRegistry";

const base = {
  countryMarket: "KSA",
  currentMarket: "URD1",
  offered: ["URD1", "KSA"],
  declined: null,
  pathname: "/ar/collections",
};

describe("countryMarketSuggestion", () => {
  it("suggests the country's market when it differs from the one in use", () => {
    expect(countryMarketSuggestion(base)).toBe("KSA");
  });
  it("says nothing when the shopper is already in it, or there is no country market", () => {
    expect(countryMarketSuggestion({ ...base, currentMarket: "KSA" })).toBeNull();
    expect(countryMarketSuggestion({ ...base, countryMarket: null })).toBeNull();
    expect(countryMarketSuggestion({ ...base, currentMarket: null })).toBeNull();
  });
  it("does not ask again after the shopper said no to that market, but asks for another", () => {
    expect(countryMarketSuggestion({ ...base, declined: "KSA" })).toBeNull();
    expect(
      countryMarketSuggestion({ ...base, countryMarket: "OMN", offered: [...base.offered, "OMN"], declined: "KSA" }),
    ).toBe("OMN");
  });
  it("only suggests markets the picker offers (live, ready)", () => {
    expect(countryMarketSuggestion({ ...base, offered: ["URD1"] })).toBeNull();
  });
  it("never interrupts checkout", () => {
    expect(countryMarketSuggestion({ ...base, pathname: "/checkout" })).toBeNull();
    expect(countryMarketSuggestion({ ...base, pathname: "/ar/checkout/payment" })).toBeNull();
    expect(countryMarketSuggestion({ ...base, pathname: "/products/checkout-oud" })).toBe("KSA");
  });
});

describe("countryDisplayName", () => {
  it("names the country in the page's language", () => {
    expect(countryDisplayName("SA", "en")).toBe("Saudi Arabia");
    expect(countryDisplayName("sa", "ar")).toMatch(/السعودية/);
    expect(countryDisplayName(undefined, "en")).toBeNull();
  });
});

const markets: SiteMarket[] = [
  { zoneCode: "URD1", countryCode: "AE", storefrontUrl: null, languages: ["en"] },
  { zoneCode: "KSA", countryCode: "sa", storefrontUrl: null, languages: ["en"] },
  { zoneCode: "OMN", countryCode: "OM", storefrontUrl: "https://omn.example.com", languages: ["en"] },
];

describe("marketForCountry", () => {
  it("on an address with all markets: the country's market", () => {
    const site = { siteMarketCode: null, markets };
    expect(marketForCountry(site, "SA")).toBe("KSA");
    expect(marketForCountry(site, "QA")).toBeNull();
    expect(marketForCountry(site, null)).toBeNull();
  });
  it("on a market website: only its own market and markets with a website", () => {
    const site = { siteMarketCode: "URD1", markets };
    expect(marketForCountry(site, "AE")).toBe("URD1");
    expect(marketForCountry(site, "OM")).toBe("OMN");
    expect(marketForCountry(site, "SA")).toBeNull();
  });
});

describe("firstVisitMarket", () => {
  it("only for a visitor with no market yet, on an address with all markets", () => {
    expect(firstVisitMarket({ siteMarketCode: null }, { savedZone: null, countryMarket: "KSA" })).toBe("KSA");
    expect(firstVisitMarket({ siteMarketCode: null }, { savedZone: "URD1", countryMarket: "KSA" })).toBeNull();
    expect(firstVisitMarket({ siteMarketCode: "URD1" }, { savedZone: null, countryMarket: "KSA" })).toBeNull();
    expect(firstVisitMarket({ siteMarketCode: null }, { savedZone: null, countryMarket: null })).toBeNull();
  });
});
