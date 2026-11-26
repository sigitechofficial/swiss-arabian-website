// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteInfo, SiteLookup } from "@/lib/site/siteRegistry";

const redirects = vi.hoisted(() => ({
  host: "uae.swissarabian.com" as string | null,
  zones: [] as Array<string | null>,
}));

vi.mock("@/lib/seo/storedRedirects", () => ({
  redirectHost: () => redirects.host,
  redirectZone: (value: string | undefined) => value ?? null,
  redirectsFor: async (_host: string, zone: string | null) => {
    redirects.zones.push(zone);
    return new Map();
  },
  matchRedirect: () => null,
  redirectLocation: () => "/",
}));

const registry = vi.hoisted(() => ({ lookup: null as unknown as SiteLookup }));

vi.mock("@/lib/site/siteRegistry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/site/siteRegistry")>();
  return { ...actual, lookupSite: async () => registry.lookup };
});

import { proxy } from "./proxy";
import { INTERNAL_REWRITE_HEADER, SHOP_LOCALE_HEADER } from "@/lib/i18n/localeRouting";

const SITE = "localhost__3041";

function site(over: Partial<SiteInfo> = {}): SiteLookup {
  return {
    status: "known",
    site: {
      host: "uae.swissarabian.com",
      brandCode: "SWISS_ARABIAN",
      storefrontCode: "sa_web",
      siteMarketCode: "URD1",
      defaultMarketCode: "URD1",
      markets: [
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: null, languages: ["en", "ar"] },
      ],
      ...over,
    },
  };
}

beforeEach(() => {
  redirects.host = "uae.swissarabian.com";
  redirects.zones = [];
  registry.lookup = site();
});

function request(path: string, headers: Record<string, string> = {}, base = "http://localhost:3041") {
  return new NextRequest(new URL(path, base), { headers });
}

/** Request headers the proxy forwards (Next's x-middleware-override protocol). */
function forwarded(response: Response, name: string): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

describe("proxy: locale routing inside the address's own tree", () => {
  it("rewrites the default language to its internal route and passes the language on", async () => {
    const response = await proxy(request("/products"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/products`);
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("en");
    expect(forwarded(response, INTERNAL_REWRITE_HEADER)).toBe("1");
  });

  it("serves prefixed languages from the address's tree with their language", async () => {
    const response = await proxy(request("/ar/nothing-here"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/ar/nothing-here`);
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("ar");
  });

  it("redirects a typed /en/ address to the unprefixed one", async () => {
    const response = await proxy(request("/en/products"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost:3041/products");
  });

  it("does not bounce its own rewrite back (no 301 loop when the proxy runs twice)", async () => {
    const response = await proxy(request(`/${SITE}/en/products`, { [INTERNAL_REWRITE_HEADER]: "1" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("en");
  });

  it("keeps each address in its own tree (market websites get their own pages)", async () => {
    const ksa = await proxy(request("/ar/products/oud", {}, "https://ksa.swissarabian.com"));
    expect(ksa.headers.get("x-middleware-rewrite")).toBe(
      "https://ksa.swissarabian.com/ksa.swissarabian.com/ar/products/oud",
    );
  });
});

describe("proxy: only the brand's own addresses", () => {
  it("answers 404 for an address the backend does not know", async () => {
    registry.lookup = { status: "unknown" };
    const response = await proxy(request("/products", {}, "https://evil.example"));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("answers 404 for another brand's address, even one the backend knows", async () => {
    registry.lookup = site({ host: "uae.sapil.com", brandCode: "SAPIL" });
    const response = await proxy(request("/products", { "x-forwarded-host": "uae.sapil.com" }));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    // Its robots.txt and sitemap too: nothing of the other brand is served.
    expect((await proxy(request("/sitemap.xml"))).status).toBe(404);
  });

  it("serves its own brand's address", async () => {
    registry.lookup = site({ brandCode: "swiss_arabian" });
    expect((await proxy(request("/products"))).status).toBe(200);
  });

  it("answers 503 (not a guess) when the address cannot be checked", async () => {
    registry.lookup = { status: "unavailable" };
    const response = await proxy(request("/products"));
    expect(response.status).toBe(503);
  });

  it("never serves another address's tree, whatever headers a client sends", async () => {
    const response = await proxy(
      request("/ksa.swissarabian.com/en/products", { [INTERNAL_REWRITE_HEADER]: "1" }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBeNull();
    // Without the header too, and for made-up addresses.
    expect((await proxy(request("/evil.example/en/products"))).status).toBe(404);
    expect((await proxy(request("/sp.localhost__3045/en"))).status).toBe(404);
  });

  it("still serves static files and /.well-known (e.g. Apple Pay domain check)", async () => {
    expect((await proxy(request("/images/logo.png"))).headers.get("x-middleware-next")).toBe("1");
    expect(
      (await proxy(request("/.well-known/apple-developer-merchantid-domain-association"))).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });

  it("ignores the market cookie for redirects on a market address", async () => {
    await proxy(request("/products", { cookie: "sa_zone=KSA" }));
    expect(redirects.zones).toEqual([null]);
  });
});

describe("proxy: served only through the hosting edge", () => {
  const saved = process.env.TRUSTED_EDGE_IDS;
  afterEach(() => {
    if (saved === undefined) delete process.env.TRUSTED_EDGE_IDS;
    else process.env.TRUSTED_EDGE_IDS = saved;
  });

  it("refuses a request that did not come through Front Door (403), headers and all", async () => {
    process.env.TRUSTED_EDGE_IDS = "fd-profile-1";
    const direct = await proxy(request("/products", { "x-forwarded-host": "uae.swissarabian.com" }));
    expect(direct.status).toBe(403);
    expect(direct.headers.get("x-middleware-rewrite")).toBeNull();
    const forged = await proxy(request("/products", { "x-azure-fdid": "someone-elses-profile" }));
    expect(forged.status).toBe(403);
  });

  it("serves requests from its Front Door profile", async () => {
    process.env.TRUSTED_EDGE_IDS = "fd-profile-1";
    const response = await proxy(request("/products", { "x-azure-fdid": "fd-profile-1" }));
    expect(response.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/products`);
  });

  it("lets the container health probe through directly", async () => {
    process.env.TRUSTED_EDGE_IDS = "fd-profile-1";
    expect((await proxy(request("/api/health"))).status).not.toBe(403);
  });

  it("serves its public files directly (the image optimizer fetches them itself), nothing else", async () => {
    process.env.TRUSTED_EDGE_IDS = "fd-profile-1";
    for (const file of ["/assets/storefront/banner.jpg", "/images/logo.png", "/favicon-32.png"]) {
      expect((await proxy(request(file))).headers.get("x-middleware-next")).toBe("1");
    }
    for (const gated of [
      "/robots.txt",
      "/sitemap.xml",
      "/products",
      "/storefront/markets",
      "/uae.swissarabian.com/en/x.png",
      "/.well-known/apple-developer-merchantid-domain-association",
    ]) {
      expect((await proxy(request(gated))).status).toBe(403);
    }
  });
});

describe("proxy: the browser's API calls go to this environment's backend (W4)", () => {
  it("forwards /storefront and /catalog (images too) to API_BASE_URL, keeping the query", async () => {
    const api = await proxy(request("/storefront/markets?countryCode=AE"));
    expect(api.headers.get("x-middleware-rewrite")).toBe("http://api.test/storefront/markets?countryCode=AE");
    const media = await proxy(request("/catalog/media/abc.jpg"));
    expect(media.headers.get("x-middleware-rewrite")).toBe("http://api.test/catalog/media/abc.jpg");
  });

  it("does not forward anything else (the backend's webhooks are not on the website)", async () => {
    const response = await proxy(request("/webhooks/stripe"));
    expect(response.headers.get("x-middleware-rewrite") ?? "").not.toContain("api.test");
  });
});

describe("proxy: a brand's root domain sends visitors to a market website", () => {
  const root = () =>
    site({
      host: "swissarabian.com",
      siteMarketCode: null,
      defaultMarketCode: "URD1",
      markets: [
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en", "ar"] },
        { zoneCode: "KSA", countryCode: "SA", storefrontUrl: "https://ksa.swissarabian.com", languages: ["en", "ar"] },
      ],
    });

  it("by country, keeping page, language and query; not cached", async () => {
    registry.lookup = root();
    const response = await proxy(
      request("/ar/products/oud?ref=x", { "x-client-country": "SA" }, "https://swissarabian.com"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://ksa.swissarabian.com/ar/products/oud?ref=x");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("by the market chosen with the picker on a market website, over country", async () => {
    registry.lookup = root();
    const response = await proxy(
      request(
        "/products",
        { "x-client-country": "AE", cookie: "sa-market-choice=KSA" },
        "https://swissarabian.com",
      ),
    );
    expect(response.headers.get("location")).toBe("https://ksa.swissarabian.com/products");
  });

  it("ignores a chosen market that has no live website", async () => {
    registry.lookup = root();
    const response = await proxy(
      request("/", { cookie: "sa-market-choice=QAT" }, "https://swissarabian.com"),
    );
    expect(response.headers.get("location")).toBe("https://uae.swissarabian.com/");
  });

  it("else the brand's default market", async () => {
    registry.lookup = root();
    const response = await proxy(request("/", {}, "https://swissarabian.com"));
    expect(response.headers.get("location")).toBe("https://uae.swissarabian.com/");
  });

  it("serves its own robots.txt (it lists the market sitemaps)", async () => {
    registry.lookup = root();
    const response = await proxy(request("/robots.txt", {}, "https://swissarabian.com"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://swissarabian.com/swissarabian.com/robots.txt",
    );
  });
});

describe("proxy: a market without a website of its own lives at /~CODE on the shared address", () => {
  // KWT has no address of its own: swissarabian.com serves it at /~KWT. QAT's own
  // address is registered but not live (still on Shopify): not served here meanwhile.
  const root = () =>
    site({
      host: "swissarabian.com",
      brandDomain: "swissarabian.com",
      sharedSiteUrl: "https://swissarabian.com",
      siteMarketCode: null,
      defaultMarketCode: "URD1",
      markets: [
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en", "ar"] },
        { zoneCode: "KWT", countryCode: "KW", storefrontUrl: null, onSharedAddress: true, languages: ["en", "ar"] },
        { zoneCode: "QAT", countryCode: "QA", storefrontUrl: null, onSharedAddress: false, languages: ["en"] },
      ],
    });
  const BASE = "https://swissarabian.com";
  const tree = (response: Response) => new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname;
  const setCookies = (response: Response) => response.headers.getSetCookie();

  it("serves /~KWT pages in KWT's tree for everyone, whatever their cookies or country (no redirect)", async () => {
    registry.lookup = root();
    const shopper = await proxy(
      request("/~KWT/ar/collections", { cookie: "sa-market-choice=URD1; sa-zone-code=URD1", "x-client-country": "AE" }, BASE),
    );
    expect(shopper.headers.get("location")).toBeNull();
    expect(tree(shopper)).toBe("/swissarabian.com~KWT/ar/collections");
    expect(forwarded(shopper, SHOP_LOCALE_HEADER)).toBe("ar");
    // A search engine: no cookies, any country, the same page.
    const crawler = await proxy(request("/~KWT/products/oud", { "x-client-country": "US" }, BASE));
    expect(crawler.headers.get("location")).toBeNull();
    expect(tree(crawler)).toBe("/swissarabian.com~KWT/en/products/oud");
  });

  it("keeps the market for the shopper (this address and the brand's domain), and writes nothing when unchanged", async () => {
    registry.lookup = root();
    const first = await proxy(request("/~KWT/collections", { cookie: "sa-market-choice=URD1" }, BASE));
    const cookies = setCookies(first);
    expect(cookies.find((c) => c.startsWith("sa-zone-code=KWT"))).toMatch(/Max-Age=31536000/i);
    expect(cookies.find((c) => c.startsWith("sa-market-choice=KWT"))).toMatch(/Domain=swissarabian\.com/i);
    const again = await proxy(
      request("/~KWT/collections", { cookie: "sa-market-choice=KWT; sa-zone-code=KWT; sa-country-market=" }, BASE),
    );
    expect(setCookies(again).filter((c) => !c.startsWith("sa-country-market="))).toEqual([]);
  });

  it("sends a plain address to the visitor's market's address: /~KWT here, or a market website", async () => {
    registry.lookup = root();
    const chosen = await proxy(request("/ar/account?x=1", { cookie: "sa-market-choice=KWT" }, BASE));
    expect(chosen.status).toBe(307);
    expect(chosen.headers.get("location")).toBe("https://swissarabian.com/~KWT/ar/account?x=1");
    expect(chosen.headers.get("cache-control")).toBe("private, no-store");
    const kuwait = await proxy(request("/collections", { "x-client-country": "KW" }, BASE));
    expect(kuwait.headers.get("location")).toBe("https://swissarabian.com/~KWT/collections");
    const home = await proxy(request("/", { "x-client-country": "KW" }, BASE));
    expect(home.headers.get("location")).toBe("https://swissarabian.com/~KWT");
    const uae = await proxy(request("/", { "x-client-country": "AE" }, BASE));
    expect(uae.headers.get("location")).toBe("https://uae.swissarabian.com/");
  });

  it("passes over a market whose own address is not live yet", async () => {
    registry.lookup = root();
    const qatar = await proxy(request("/", { "x-client-country": "QA" }, BASE));
    expect(qatar.headers.get("location")).toBe("https://uae.swissarabian.com/");
    const qatarLink = await proxy(request("/~QAT/products", {}, BASE));
    expect(qatarLink.headers.get("location")).toBe("https://swissarabian.com/products");
    expect(setCookies(qatarLink)).toEqual([]);
  });

  it("a segment for a market with a website of its own opens there; one address per market code; unknown ones are dropped", async () => {
    registry.lookup = root();
    const own = await proxy(request("/~URD1/ar/products/oud?ref=x", {}, BASE));
    expect(own.headers.get("location")).toBe("https://uae.swissarabian.com/ar/products/oud?ref=x");
    const lower = await proxy(request("/~kwt/ar/products/oud", {}, BASE));
    expect(lower.status).toBe(308);
    expect(lower.headers.get("location")).toBe("https://swissarabian.com/~KWT/ar/products/oud");
    const unknown = await proxy(request("/~NOPE", {}, BASE));
    expect(unknown.headers.get("location")).toBe("https://swissarabian.com/");
  });

  it("its own redirects stay in the market's segment (a typed default language)", async () => {
    registry.lookup = root();
    const response = await proxy(request("/~KWT/en/collections", {}, BASE));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://swissarabian.com/~KWT/collections");
  });

  it("serves files and API calls under a segment as without it, and the market's own sitemap", async () => {
    registry.lookup = root();
    const file = await proxy(request("/~KWT/images/logo.png", {}, BASE));
    expect(new URL(file.headers.get("x-middleware-rewrite") ?? "").pathname).toBe("/images/logo.png");
    const media = await proxy(request("/~KWT/catalog/media/abc.jpg", {}, BASE));
    expect(media.headers.get("x-middleware-rewrite")).toBe("http://api.test/catalog/media/abc.jpg");
    const sitemap = await proxy(request("/~KWT/sitemap.xml", {}, BASE));
    expect(tree(sitemap)).toBe("/swissarabian.com~KWT/sitemap.xml");
    const rootSitemap = await proxy(request("/sitemap.xml", {}, BASE));
    expect(tree(rootSitemap)).toBe("/swissarabian.com/sitemap.xml");
  });
});

describe("proxy: the main address is Global's own website (swissarabian.com)", () => {
  // swissarabian.com is GLOBAL's address and the brand's main address; UAE has its
  // own; NEW has none (served at swissarabian.com/~NEW); QAT's own address is pending.
  const main = (rule?: "REDIRECT" | "SUGGEST" | "STAY") =>
    site({
      host: "swissarabian.com",
      brandDomain: "swissarabian.com",
      sharedSiteUrl: "https://swissarabian.com",
      siteMarketCode: "GLOBAL",
      defaultMarketCode: "URD1",
      ...(rule ? { mainAddressVisitors: rule } : {}),
      markets: [
        { zoneCode: "GLOBAL", countryCode: "US", storefrontUrl: "https://swissarabian.com", languages: ["en", "ar"] },
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en", "ar"] },
        { zoneCode: "NEW", countryCode: "KW", storefrontUrl: null, onSharedAddress: true, languages: ["en", "ar"] },
        { zoneCode: "QAT", countryCode: "QA", storefrontUrl: null, onSharedAddress: false, languages: ["en"] },
      ],
    });
  const BASE = "https://swissarabian.com";
  const tree = (response: Response) => new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname;
  const setCookies = (response: Response) => response.headers.getSetCookie();

  it("serves Global's pages at their plain addresses (as on Shopify), in its own tree", async () => {
    registry.lookup = main();
    const product = await proxy(request("/products/oud", {}, BASE));
    expect(product.headers.get("location")).toBeNull();
    expect(tree(product)).toBe("/swissarabian.com/en/products/oud");
    const arabic = await proxy(request("/ar/collections", {}, BASE));
    expect(tree(arabic)).toBe("/swissarabian.com/ar/collections");
  });

  it("SUGGEST (the default): a Gulf visitor stays on Global and is offered their market by the banner", async () => {
    registry.lookup = main();
    const response = await proxy(request("/products/oud", { "x-client-country": "AE" }, BASE));
    expect(response.headers.get("location")).toBeNull();
    expect(tree(response)).toBe("/swissarabian.com/en/products/oud");
    expect(setCookies(response).some((c) => c.startsWith("sa-country-market=URD1"))).toBe(true);
  });

  it("REDIRECT: a visitor of another market goes there (choice first, then country); Global's own stay", async () => {
    registry.lookup = main("REDIRECT");
    const uae = await proxy(request("/ar/products/oud?x=1", { "x-client-country": "AE" }, BASE));
    expect(uae.status).toBe(307);
    expect(uae.headers.get("location")).toBe("https://uae.swissarabian.com/ar/products/oud?x=1");
    const chosen = await proxy(request("/collections", { cookie: "sa-market-choice=NEW", "x-client-country": "AE" }, BASE));
    expect(chosen.headers.get("location")).toBe("https://swissarabian.com/~NEW/collections");
    const stays = await proxy(request("/collections", { cookie: "sa-market-choice=GLOBAL", "x-client-country": "AE" }, BASE));
    expect(stays.headers.get("location")).toBeNull();
    const us = await proxy(request("/collections", { "x-client-country": "US" }, BASE));
    expect(us.headers.get("location")).toBeNull();
    // A market whose own address is not live yet: stay on Global.
    const qatar = await proxy(request("/collections", { "x-client-country": "QA" }, BASE));
    expect(qatar.headers.get("location")).toBeNull();
  });

  it("STAY: no redirect and no suggestion", async () => {
    registry.lookup = main("STAY");
    const response = await proxy(request("/", { "x-client-country": "AE", cookie: "sa-country-market=URD1" }, BASE));
    expect(response.headers.get("location")).toBeNull();
    const cleared = setCookies(response).find((c) => c.startsWith("sa-country-market="));
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it("serves a market without an address of its own at /~NEW, in its own tree; drops other segments", async () => {
    registry.lookup = main("REDIRECT");
    const page = await proxy(request("/~NEW/ar/products/oud", { "x-client-country": "AE" }, BASE));
    expect(page.headers.get("location")).toBeNull();
    expect(tree(page)).toBe("/swissarabian.com~NEW/ar/products/oud");
    const cookies = setCookies(page);
    expect(cookies.find((c) => c.startsWith("sa-market-choice=NEW"))).toMatch(/Domain=swissarabian\.com/i);
    const own = await proxy(request("/~GLOBAL/products/oud", {}, BASE));
    expect(own.headers.get("location")).toBe("https://swissarabian.com/products/oud");
    const uae = await proxy(request("/~URD1/products/oud", {}, BASE));
    expect(uae.headers.get("location")).toBe("https://uae.swissarabian.com/products/oud");
    const pending = await proxy(request("/~QAT/products", {}, BASE));
    expect(pending.headers.get("location")).toBe("https://swissarabian.com/products");
  });

  it("serves /~NEW's own tree on the second pass, and refuses made-up markets", async () => {
    registry.lookup = main();
    const own = await proxy(request("/swissarabian.com~NEW/en/collections", { [INTERNAL_REWRITE_HEADER]: "1" }, BASE));
    expect(own.headers.get("x-middleware-next")).toBe("1");
    const global = await proxy(request("/swissarabian.com~GLOBAL/en/collections", { [INTERNAL_REWRITE_HEADER]: "1" }, BASE));
    expect(global.status).toBe(404);
  });

  it("other market websites are unchanged: no /~CODE there, no visitor rule", async () => {
    registry.lookup = site({
      host: "uae.swissarabian.com",
      brandDomain: "swissarabian.com",
      sharedSiteUrl: "https://swissarabian.com",
      siteMarketCode: "URD1",
      mainAddressVisitors: "REDIRECT",
      markets: [
        { zoneCode: "GLOBAL", countryCode: "US", storefrontUrl: "https://swissarabian.com", languages: ["en"] },
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: "https://uae.swissarabian.com", languages: ["en", "ar"] },
        { zoneCode: "NEW", countryCode: "KW", storefrontUrl: null, onSharedAddress: true, languages: ["en"] },
      ],
    });
    const us = await proxy(request("/products/oud", { "x-client-country": "US" }, "https://uae.swissarabian.com"));
    expect(us.headers.get("location")).toBeNull();
    expect(tree(us)).toBe("/uae.swissarabian.com/en/products/oud");
    const segment = await proxy(request("/~NEW/products/oud", {}, "https://uae.swissarabian.com"));
    expect(segment.headers.get("location")).toBe("https://uae.swissarabian.com/products/oud");
  });
});

describe("proxy: one address for all of a brand's markets (first visit by country)", () => {
  const brandSite = () =>
    site({
      host: "ca-swissarabian-website-dev.example.azurecontainerapps.io",
      siteMarketCode: null,
      defaultMarketCode: "URD1",
      markets: [
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: null, languages: ["en", "ar"] },
        { zoneCode: "KSA", countryCode: "SA", storefrontUrl: null, languages: ["en", "ar"] },
      ],
    });
  const BASE = "https://ca-swissarabian-website-dev.example.azurecontainerapps.io";
  const setCookies = (response: Response) => response.headers.getSetCookie();

  it("starts a first visit in the country's market: the page is drawn for it and it is saved", async () => {
    registry.lookup = brandSite();
    const response = await proxy(request("/ar/collections", { "x-client-country": "SA" }, BASE));
    expect(response.headers.get("x-middleware-rewrite")).toContain("/ar/collections");
    expect(forwarded(response, "cookie")).toContain("sa-zone-code=KSA");
    const cookies = setCookies(response);
    expect(cookies.find((c) => c.startsWith("sa-zone-code=KSA"))).toMatch(/Max-Age=31536000/i);
    expect(cookies.find((c) => c.startsWith("sa-zone-code="))).toMatch(/Secure/i);
    expect(cookies.some((c) => c.startsWith("sa-country-market=KSA"))).toBe(true);
  });

  it("keeps the shopper's saved market over their country, and tells the page the country's market", async () => {
    registry.lookup = brandSite();
    const response = await proxy(
      request("/", { "x-client-country": "SA", cookie: "sa-zone-code=URD1" }, BASE),
    );
    expect(forwarded(response, "cookie") ?? "").not.toContain("sa-zone-code=KSA");
    const cookies = setCookies(response);
    expect(cookies.some((c) => c.startsWith("sa-zone-code="))).toBe(false);
    expect(cookies.some((c) => c.startsWith("sa-country-market=KSA"))).toBe(true);
  });

  it("writes nothing when nothing changed (repeat visits stay cacheable)", async () => {
    registry.lookup = brandSite();
    const response = await proxy(
      request("/", { "x-client-country": "SA", cookie: "sa-zone-code=KSA; sa-country-market=KSA" }, BASE),
    );
    expect(setCookies(response)).toEqual([]);
  });

  it("leaves a country with no market (or no country) to the default market, and clears an old country market", async () => {
    registry.lookup = brandSite();
    const qatar = await proxy(request("/", { "x-client-country": "QA" }, BASE));
    expect(setCookies(qatar)).toEqual([]);
    expect(forwarded(qatar, "cookie") ?? "").not.toContain("sa-zone-code=");
    const unknown = await proxy(
      request("/", { "x-client-country": "ZZ", cookie: "sa-zone-code=URD1; sa-country-market=KSA" }, BASE),
    );
    const cleared = setCookies(unknown).find((c) => c.startsWith("sa-country-market="));
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it("uses the first visit's market for the admin's URL redirects", async () => {
    registry.lookup = brandSite();
    await proxy(request("/old-page", { "x-client-country": "SA" }, BASE));
    expect(redirects.zones).toEqual(["KSA"]);
  });

  const HOST_KEY = "ca-swissarabian-website-dev.example.azurecontainerapps.io";
  const tree = (response: Response) => new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname;

  it("serves each market from its own page tree (cached per market, no cookie read by pages)", async () => {
    registry.lookup = brandSite();
    const first = await proxy(request("/ar/collections", { "x-client-country": "SA" }, BASE));
    expect(tree(first)).toBe(`/${HOST_KEY}~KSA/ar/collections`);
    const saved = await proxy(request("/collections", { cookie: "sa-zone-code=URD1", "x-client-country": "SA" }, BASE));
    expect(tree(saved)).toBe(`/${HOST_KEY}~URD1/en/collections`);
    const none = await proxy(request("/collections", {}, BASE));
    expect(tree(none)).toBe(`/${HOST_KEY}~URD1/en/collections`);
    const unknown = await proxy(request("/collections", { cookie: "sa-zone-code=NOPE" }, BASE));
    expect(tree(unknown)).toBe(`/${HOST_KEY}~URD1/en/collections`);
  });

  it("serves its own market trees on the second pass, and refuses made-up markets", async () => {
    registry.lookup = brandSite();
    const own = await proxy(
      request(`/${HOST_KEY}~KSA/en/collections`, { [INTERNAL_REWRITE_HEADER]: "1" }, BASE),
    );
    expect(own.headers.get("x-middleware-next")).toBe("1");
    const madeUp = await proxy(
      request(`/${HOST_KEY}~FAKE/en/collections`, { [INTERNAL_REWRITE_HEADER]: "1" }, BASE),
    );
    expect(madeUp.headers.get("x-middleware-next")).toBeNull();
    expect(madeUp.status).toBe(404);
    const typed = await proxy(request(`/${HOST_KEY}~KSA/en/collections`, {}, BASE));
    expect(typed.status).toBe(404);
  });

  it("never sets a first-visit market on a market website (its address decides)", async () => {
    registry.lookup = site({
      markets: [
        { zoneCode: "URD1", countryCode: "AE", storefrontUrl: null, languages: ["en", "ar"] },
        { zoneCode: "KSA", countryCode: "SA", storefrontUrl: "https://ksa.swissarabian.com", languages: ["en"] },
      ],
    });
    const response = await proxy(request("/", { "x-client-country": "SA" }, "https://uae.swissarabian.com"));
    const cookies = setCookies(response);
    expect(cookies.some((c) => c.startsWith("sa-zone-code="))).toBe(false);
    // The suggestion can still offer KSA (switching goes to its website).
    expect(cookies.some((c) => c.startsWith("sa-country-market=KSA"))).toBe(true);
  });
});

describe("proxy: brand feature switches", () => {
  const original = process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
  const restore = () => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
    else process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = original;
  };

  it("sends a switched-off section to the server-rendered 404, in the address's language", async () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SAPIL";
    registry.lookup = site({ host: "uae.sapil.com", brandCode: "SAPIL", storefrontCode: "sapil_web" });
    try {
      const en = await proxy(request("/account/rewards?x=1"));
      expect(en.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/_section-off`);
      expect(forwarded(en, SHOP_LOCALE_HEADER)).toBe("en");
      const ar = await proxy(request("/ar/subscriptions/PLAN/checkout"));
      expect(ar.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/ar/_section-off`);
      expect(forwarded(ar, SHOP_LOCALE_HEADER)).toBe("ar");
      // Sections Sapil keeps are untouched.
      const blog = await proxy(request("/blog"));
      expect(blog.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/blog`);
    } finally {
      restore();
    }
  });

  it("leaves every section to Swiss Arabian", async () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SWISS_ARABIAN";
    try {
      const response = await proxy(request("/store-locator"));
      expect(response.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/store-locator`);
    } finally {
      restore();
    }
  });
});
