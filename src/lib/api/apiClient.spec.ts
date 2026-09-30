import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "./apiClient";

describe("api client storefront host", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the browser host", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, host: "shop.example:3000" },
    });
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      calls.push([String(input), init]);
      return new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiGet("/storefront/markets");

    const headers = new Headers(calls[0]?.[1]?.headers);
    expect(headers.get("x-storefront-host")).toBe("shop.example:3000");
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
