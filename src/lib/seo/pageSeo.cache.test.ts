import { beforeEach, describe, expect, it, vi } from "vitest";

const cached = vi.hoisted(() => ({
  fn: null as null | ((...args: unknown[]) => Promise<unknown>),
  options: null as null | { revalidate?: number },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>, _keys: string[], options: { revalidate?: number }) => {
    cached.fn = fn;
    cached.options = options;
    return fn;
  },
}));
vi.mock("@/lib/seo/catalogPage", () => ({
  catalogMetadata: vi.fn(),
  resolveServerCatalogMarket: vi.fn(async () => ({ locale: "en", zoneCode: "SAPIL_URD1" })),
}));
vi.mock("@/lib/api/storefrontHost", () => ({ resolveStorefrontHost: vi.fn(async () => "sapil.test") }));

import { canHavePageSeoRecord, loadPublishedPageSeo, PAGE_SEO_REVALIDATE_SECONDS } from "./pageSeo";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("canHavePageSeoRecord", () => {
  it("skips products, collections and categories (catalog API SEO)", () => {
    expect(canHavePageSeoRecord("/products")).toBe(false);
    expect(canHavePageSeoRecord("/products/oud-royal")).toBe(false);
    expect(canHavePageSeoRecord("/collections/oud")).toBe(false);
    expect(canHavePageSeoRecord("/categories/men")).toBe(false);
  });

  it("asks for fixed site pages", () => {
    expect(canHavePageSeoRecord("/")).toBe(true);
    expect(canHavePageSeoRecord("/collections")).toBe(true);
    expect(canHavePageSeoRecord("/track")).toBe(true);
    expect(canHavePageSeoRecord("/faq")).toBe(true);
  });
});

describe("loadPublishedPageSeo", () => {
  it("never calls the API for /products", async () => {
    const result = await loadPublishedPageSeo("/products");
    expect(result.seo).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches with the pages' revalidate period", () => {
    expect(cached.options?.revalidate).toBe(PAGE_SEO_REVALIDATE_SECONDS);
    expect(PAGE_SEO_REVALIDATE_SECONDS).toBe(300);
  });

  it("returns a 404 as 'no record' (a cacheable value, not an error)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 404 }));
    await expect(cached.fn!("/", "en", "SAPIL_URD1", "sapil.test")).resolves.toBeNull();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/storefront/catalog/page-seo?path=%2F&locale=en&zoneCode=SAPIL_URD1");
    expect((init as RequestInit).headers).toEqual({ "x-storefront-host": "sapil.test" });
  });

  it("throws a 5xx inside the cache (never cached) and the page keeps its defaults", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 503 }));
    await expect(cached.fn!("/faq", "en", "SAPIL_URD1", null)).rejects.toThrow();
    const result = await loadPublishedPageSeo("/faq");
    expect(result.seo).toBeNull();
  });

  it("reads a published record", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { path: "/about", seo: { title: "About Sapil" } } }), { status: 200 }),
    );
    const result = await loadPublishedPageSeo("/about");
    expect(result.seo).toEqual({ title: "About Sapil" });
  });
});
