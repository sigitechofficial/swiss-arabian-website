import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/storedRedirects", () => ({
  redirectHost: () => null,
  redirectZone: () => null,
  redirectsFor: async () => [],
  matchRedirect: () => null,
  redirectLocation: () => "/",
}));

import { proxy } from "./proxy";
import { INTERNAL_REWRITE_HEADER, SHOP_LOCALE_HEADER } from "@/lib/i18n/localeRouting";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3041"), { headers });
}

/** Request headers the proxy forwards (Next's x-middleware-override protocol). */
function forwarded(response: Response, name: string): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

describe("proxy: locale routing", () => {
  it("rewrites the default language to its internal route and passes the language on", async () => {
    const response = await proxy(request("/products"));
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3041/en/products");
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("en");
    expect(forwarded(response, INTERNAL_REWRITE_HEADER)).toBe("1");
  });

  it("passes prefixed languages through with their language", async () => {
    const response = await proxy(request("/ar/nothing-here"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("ar");
  });

  it("redirects a typed /en/ address to the unprefixed one", async () => {
    const response = await proxy(request("/en/products"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("http://localhost:3041/products");
  });

  it("does not bounce its own rewrite back (no 301 loop when the proxy runs twice)", async () => {
    const response = await proxy(request("/en/products", { [INTERNAL_REWRITE_HEADER]: "1" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(forwarded(response, SHOP_LOCALE_HEADER)).toBe("en");
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
      expect(en.headers.get("x-middleware-rewrite")).toBe("http://localhost:3041/en/_section-off");
      expect(forwarded(en, SHOP_LOCALE_HEADER)).toBe("en");
      const ar = await proxy(request("/ar/subscriptions/PLAN/checkout"));
      expect(ar.headers.get("x-middleware-rewrite")).toBe("http://localhost:3041/ar/_section-off");
      expect(forwarded(ar, SHOP_LOCALE_HEADER)).toBe("ar");
      // Sections Sapil keeps are untouched.
      const blog = await proxy(request("/blog"));
      expect(blog.headers.get("x-middleware-rewrite")).toBe("http://localhost:3041/en/blog");
    } finally {
      restore();
    }
  });

  it("leaves every section to Swiss Arabian", async () => {
    process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE = "SWISS_ARABIAN";
    try {
      const response = await proxy(request("/stores"));
      expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3041/en/stores");
    } finally {
      restore();
    }
  });
});
