import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
      request("/ar/products/oud?ref=x", { "x-vercel-ip-country": "SA" }, "https://swissarabian.com"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://ksa.swissarabian.com/ar/products/oud?ref=x");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
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

describe("proxy: brand feature switches", () => {
  const original = process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
  const restore = () => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE;
    else process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = original;
  };

  it("sends a switched-off section to the server-rendered 404, in the address's language", async () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SAPIL";
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
      const response = await proxy(request("/stores"));
      expect(response.headers.get("x-middleware-rewrite")).toBe(`http://localhost:3041/${SITE}/en/stores`);
    } finally {
      restore();
    }
  });
});
