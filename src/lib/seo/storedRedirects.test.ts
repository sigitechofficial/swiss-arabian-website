import { afterEach, describe, expect, it, vi } from "vitest";
import {
  matchRedirect,
  normalizeRequestPath,
  redirectLocation,
  redirectsFor,
  redirectZone,
} from "./storedRedirects";

const map = new Map([
  ["/collections/old-oud", "/collections/oud"],
  ["/pages/story", "https://example.com/story"],
  ["/ar/collections/types", "/ar/collections"],
  ["/collections/home", "/"],
]);

describe("normalizeRequestPath", () => {
  it("matches the stored form", () => {
    expect(normalizeRequestPath("/Collections/Old-Oud/")).toBe(
      "/collections/old-oud",
    );
    expect(normalizeRequestPath("/products/%D8%B9%D9%88%D8%AF")).toBe(
      "/products/عود",
    );
  });
});

describe("matchRedirect", () => {
  it("finds the redirect for the old path", () => {
    expect(matchRedirect(map, "/Collections/old-oud/")).toBe(
      "/collections/oud",
    );
    expect(matchRedirect(map, "/collections/oud")).toBeNull();
  });

  it("uses an Arabic redirect first, else keeps /ar on the English one", () => {
    expect(matchRedirect(map, "/ar/collections/types")).toBe("/ar/collections");
    expect(matchRedirect(map, "/ar/collections/old-oud")).toBe(
      "/ar/collections/oud",
    );
    expect(matchRedirect(map, "/ar/collections/home")).toBe("/ar");
    expect(matchRedirect(map, "/ar/pages/story")).toBe(
      "https://example.com/story",
    );
  });
});

describe("redirectLocation", () => {
  const request = new URL(
    "https://uae.swissarabian.com/collections/old-oud?utm_source=ig",
  );

  it("keeps the query on a site target", () => {
    expect(redirectLocation("/collections/oud", request).toString()).toBe(
      "https://uae.swissarabian.com/collections/oud?utm_source=ig",
    );
  });

  it("drops a trailing slash from a site target (one hop, not two)", () => {
    expect(redirectLocation("/collections/", request).toString()).toBe(
      "https://uae.swissarabian.com/collections?utm_source=ig",
    );
    expect(redirectLocation("/ar/", request).pathname).toBe("/ar");
    expect(redirectLocation("/", request).pathname).toBe("/");
  });

  it("keeps the target's own query and other sites as they are", () => {
    expect(
      redirectLocation("/collections/oud?sort=new", request).toString(),
    ).toBe("https://uae.swissarabian.com/collections/oud?sort=new");
    expect(
      redirectLocation("https://example.com/story", request).toString(),
    ).toBe("https://example.com/story");
  });
});

describe("redirectZone", () => {
  it("accepts a market code and ignores anything else", () => {
    expect(redirectZone(" QTR ")).toBe("QTR");
    expect(redirectZone("URD1")).toBe("URD1");
    expect(redirectZone("")).toBeNull();
    expect(redirectZone(undefined)).toBeNull();
    expect(redirectZone("QTR&x=1")).toBeNull();
  });
});

describe("redirectsFor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubBackend(lists: Record<string, Array<{ from: string; to: string }> | null>) {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const zone = url.searchParams.get("zoneCode") ?? "DOMAIN";
      const redirects = lists[zone];
      return new Response(
        JSON.stringify({
          data: {
            zoneCode: redirects ? (zone === "DOMAIN" ? "URD1" : zone) : null,
            redirects: redirects ?? [],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("uses the redirects of the shopper's market", async () => {
    const fetchMock = stubBackend({
      DOMAIN: [{ from: "/pages/contact", to: "/pages/contact-us" }],
      QTR: [{ from: "/pages/product-catalogue1", to: "/pages/download-product-catalogue" }],
    });
    const qatar = await redirectsFor("market-a.example", "QTR");
    expect(qatar.get("/pages/product-catalogue1")).toBe("/pages/download-product-catalogue");
    expect(qatar.has("/pages/contact")).toBe(false);
    const domain = await redirectsFor("market-a.example");
    expect(domain.get("/pages/contact")).toBe("/pages/contact-us");
    expect(String(fetchMock.mock.calls[0][0])).toContain("zoneCode=QTR");
    expect(String(fetchMock.mock.calls[1][0])).not.toContain("zoneCode");
  });

  it("falls back to the domain's market for a market the website does not have", async () => {
    stubBackend({
      DOMAIN: [{ from: "/pages/contact", to: "/pages/contact-us" }],
      KSA: null,
    });
    const map = await redirectsFor("market-b.example", "KSA");
    expect(map.get("/pages/contact")).toBe("/pages/contact-us");
  });
});
