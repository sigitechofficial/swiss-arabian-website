import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({ env: { apiBaseUrl: "https://api.test" } }));

import { clearProductAddressCache, productAddressRedirect } from "./productAddress";

const HOST = "uae.swissarabian.com";
type Reply = { status: number; data?: unknown };

function backend(routes: Record<string, Reply>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      const key = Object.keys(routes).find((k) => url.includes(k));
      const reply = key ? routes[key] : { status: 404 };
      return new Response(JSON.stringify({ success: reply.status < 400, data: reply.data ?? null }), {
        status: reply.status,
      });
    }),
  );
  return calls;
}

/** SEO audit p9: old product addresses must keep working (one clean redirect). */
describe("productAddressRedirect", () => {
  beforeEach(() => clearProductAddressCache());
  afterEach(() => vi.unstubAllGlobals());

  it("sends a SKU address the product endpoint knows to the product's own address", async () => {
    backend({ "/products/SOTO098501?": { status: 200, data: { slug: "shaghaf-oud-tonka" } } });
    await expect(
      productAddressRedirect({ pathname: "/products/SOTO098501", storefrontHost: HOST, zoneCode: "URD1" }),
    ).resolves.toBe("/products/shaghaf-oud-tonka");
  });

  it("finds a SKU through search with an exact match, like the page does", async () => {
    const calls = backend({
      "/products/ZCAN032801?": { status: 404 },
      "/catalog/search?": {
        status: 200,
        data: { products: [{ slug: "zahra-candy-gift", sku: "ZCAN032802" }, { slug: "zahra-candy", sku: "ZCAN032801" }] },
      },
    });
    await expect(
      productAddressRedirect({ pathname: "/products/ZCAN032801", storefrontHost: HOST, zoneCode: "URD1" }),
    ).resolves.toBe("/products/zahra-candy");
    expect(calls.some((u) => u.includes("zoneCode=URD1") && u.includes("q=ZCAN032801"))).toBe(true);
  });

  it("keeps the language prefix", async () => {
    backend({ "/products/SOTO098501?": { status: 200, data: { slug: "shaghaf-oud-tonka" } } });
    await expect(
      productAddressRedirect({ pathname: "/ar/products/SOTO098501", storefrontHost: HOST, zoneCode: "URD1" }),
    ).resolves.toBe("/ar/products/shaghaf-oud-tonka");
  });

  it("leaves the product's own address, other pages and unknown products to the page", async () => {
    const calls = backend({
      "/products/zahra-candy?": { status: 200, data: { slug: "zahra-candy" } },
      "/catalog/search?": { status: 200, data: { products: [{ slug: "something-else", sku: "X1" }] } },
    });
    await expect(productAddressRedirect({ pathname: "/products/zahra-candy", storefrontHost: HOST, zoneCode: "URD1" })).resolves.toBeNull();
    await expect(productAddressRedirect({ pathname: "/products/no-such-thing", storefrontHost: HOST, zoneCode: "URD1" })).resolves.toBeNull();
    const before = calls.length;
    await expect(productAddressRedirect({ pathname: "/collections/women", storefrontHost: HOST, zoneCode: "URD1" })).resolves.toBeNull();
    expect(calls.length).toBe(before);
  });

  it("does not guess when the backend is down, and asks again next time", async () => {
    backend({ "/products/SOTO098501?": { status: 503 } });
    await expect(productAddressRedirect({ pathname: "/products/SOTO098501", storefrontHost: HOST, zoneCode: "URD1" })).resolves.toBeNull();
    backend({ "/products/SOTO098501?": { status: 200, data: { slug: "shaghaf-oud-tonka" } } });
    await expect(productAddressRedirect({ pathname: "/products/SOTO098501", storefrontHost: HOST, zoneCode: "URD1" })).resolves.toBe("/products/shaghaf-oud-tonka");
  });

  it("remembers an answer for a few minutes (one backend call per address)", async () => {
    const calls = backend({ "/products/SOTO098501?": { status: 200, data: { slug: "shaghaf-oud-tonka" } } });
    for (let i = 0; i < 3; i += 1) {
      await productAddressRedirect({ pathname: "/products/SOTO098501", storefrontHost: HOST, zoneCode: "URD1" });
    }
    expect(calls.length).toBe(1);
  });
});
