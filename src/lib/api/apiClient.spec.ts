import { afterEach, describe, expect, it, vi } from "vitest";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/token";
import { apiGet } from "./apiClient";
import { getVisitorId, setTrackingConsent } from "@/lib/analytics/tracker";

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

describe("api client session refresh", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearTokens();
  });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  /** First call: the request (401); then the refresh answers `refresh`; then the retried request. */
  function stubFetch(refresh: () => Response | Promise<Response>) {
    const fetchMock = vi.fn(async (input: string) => {
      if (String(input).endsWith("/storefront/auth/refresh")) return refresh();
      const authorised = fetchMock.mock.calls.some(([url]) => String(url).endsWith("/storefront/auth/refresh"));
      return authorised
        ? json(200, { success: true, data: { id: "c1" } })
        : json(401, { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("refreshes and retries once", async () => {
    setTokens("old", "refresh");
    stubFetch(() => json(200, { success: true, data: { accessToken: "new", refreshToken: "refresh-2" } }));
    await expect(apiGet("/storefront/customer/me")).resolves.toEqual({ id: "c1" });
    expect(getAccessToken()).toBe("new");
  });

  it("a refused refresh ends the session", async () => {
    setTokens("old", "refresh");
    stubFetch(() => json(401, { success: false }));
    await expect(apiGet("/storefront/customer/me")).rejects.toMatchObject({ status: 401 });
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it.each([
    ["a server error", () => json(502, { success: false })],
    ["a dropped connection", () => Promise.reject(new TypeError("Failed to fetch"))],
  ])("%s during refresh keeps the session", async (_label, refresh) => {
    setTokens("old", "refresh");
    stubFetch(refresh as () => Promise<Response>);
    await expect(apiGet("/storefront/customer/me")).rejects.toMatchObject({ status: 503 });
    expect(getAccessToken()).toBe("old");
    expect(getRefreshToken()).toBe("refresh");
  });
});

describe("api client behaviour ids", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  async function headersOf(): Promise<Headers> {
    const calls: Array<RequestInit | undefined> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string, init?: RequestInit) => {
        calls.push(init);
        return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
      }),
    );
    await apiGet("/storefront/catalog/search?q=oud");
    return new Headers(calls[0]?.headers);
  }

  it("sends the tracker's ids once the shopper allowed analytics", async () => {
    setTrackingConsent("granted");
    const headers = await headersOf();
    expect(headers.get("x-behavior-visitor")).toBe(getVisitorId());
    expect(headers.get("x-behavior-session")).toMatch(/^[0-9a-f-]{36}$/);
    expect(headers.get("x-behavior-consent")).toBe("GRANTED");
  });

  it("sends none without analytics consent", async () => {
    setTrackingConsent("denied");
    const headers = await headersOf();
    expect(headers.has("x-behavior-visitor")).toBe(false);
    expect(headers.has("x-behavior-session")).toBe(false);
  });
});
