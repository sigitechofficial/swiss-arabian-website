import { afterEach, describe, expect, it, vi } from "vitest";
import { hostFromSiteKey, normalizeSiteHost, siteKeyFromHost, siteOriginFor } from "./siteKey";
import {
  clearSiteCache,
  lookupSite,
  marketSiteForVisitor,
  visitorCountry,
  type SiteInfo,
} from "./siteRegistry";

describe("site key (the address's internal route segment)", () => {
  it("round-trips hosts with and without a port", () => {
    expect(siteKeyFromHost("ksa.swissarabian.com")).toBe("ksa.swissarabian.com");
    expect(siteKeyFromHost("sp.localhost:3045")).toBe("sp.localhost__3045");
    expect(hostFromSiteKey("sp.localhost__3045")).toBe("sp.localhost:3045");
    expect(hostFromSiteKey("KSA.swissarabian.com")).toBe("ksa.swissarabian.com");
  });

  it("refuses anything that is not a plain host", () => {
    for (const bad of ["", "a/b", "evil.com:1:2", "..", ".x.com", "x..com", "a b", "x.com__", "%2e%2e"]) {
      expect(hostFromSiteKey(bad)).toBeNull();
    }
    expect(normalizeSiteHost("Shop.Example.com., edge")).toBe("shop.example.com");
    expect(normalizeSiteHost("evil.com/path")).toBeNull();
  });

  it("uses http only for local addresses", () => {
    expect(siteOriginFor("ksa.swissarabian.com")).toBe("https://ksa.swissarabian.com");
    expect(siteOriginFor("sp.localhost:3045")).toBe("http://sp.localhost:3045");
  });
});

const ROOT: SiteInfo = {
  host: "swissarabian.com",
  brandCode: "SWISS_ARABIAN",
  storefrontCode: "sa_web",
  siteMarketCode: null,
  defaultMarketCode: "URD1",
  markets: [
    { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en", "ar"] },
    { zoneCode: "KSA", countryCode: "SA", storefrontUrl: "https://ksa.swissarabian.com", languages: ["en", "ar"] },
    { zoneCode: "QTR", countryCode: "QA", storefrontUrl: null, languages: ["en"] },
  ],
};

describe("root domain → market website", () => {
  it("prefers the visitor's earlier market, then their country, then the default", () => {
    expect(marketSiteForVisitor(ROOT, { zoneCode: "KSA", country: "AE" })).toBe("https://ksa.swissarabian.com");
    expect(marketSiteForVisitor(ROOT, { country: "SA" })).toBe("https://ksa.swissarabian.com");
    expect(marketSiteForVisitor(ROOT, { country: "DE" })).toBe("https://uae.swissarabian.com");
  });

  it("never sends to a market without its own website, nor away from a market website", () => {
    expect(marketSiteForVisitor(ROOT, { zoneCode: "QTR", country: "QA" })).toBe("https://uae.swissarabian.com");
    expect(marketSiteForVisitor({ ...ROOT, siteMarketCode: "URD1" }, { country: "SA" })).toBeNull();
    expect(
      marketSiteForVisitor({ ...ROOT, markets: ROOT.markets.map((m) => ({ ...m, storefrontUrl: null })) }, {}),
    ).toBeNull();
  });

  it("reads the visitor's country from the hosting edge", () => {
    expect(visitorCountry(new Headers({ "x-vercel-ip-country": "sa" }))).toBe("SA");
    expect(visitorCountry(new Headers({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(visitorCountry(new Headers())).toBeNull();
  });
});

describe("site lookup (backend address table, cached)", () => {
  afterEach(() => {
    clearSiteCache();
    vi.unstubAllGlobals();
  });

  it("knows an address, remembers it, and asks with the address", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: ROOT }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await lookupSite("swissarabian.com")).toEqual({ status: "known", site: ROOT });
    await lookupSite("swissarabian.com");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]![1] as RequestInit).headers).toEqual({
      "x-storefront-host": "swissarabian.com",
    });
  });

  it("an unknown address is unknown; an outage is never cached as unknown", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    expect(await lookupSite("evil.example")).toEqual({ status: "unknown" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await lookupSite("new.example")).toEqual({ status: "unavailable" });
    // Next request tries again (no cached outage).
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: ROOT }), { status: 200 })),
    );
    expect((await lookupSite("new.example")).status).toBe("known");
  });
});
