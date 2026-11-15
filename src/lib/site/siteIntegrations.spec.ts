import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown, keys: string[], options: { tags: string[]; revalidate: number }) => {
    cacheCalls.push({ keys, options });
    return fn;
  },
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));
const cacheCalls: Array<{ keys: string[]; options: { tags: string[]; revalidate: number } }> = [];

import { POST } from "@/app/api/site-config/revalidate/route";
import { loadSiteIntegrations, parseSiteIntegrations, SITE_INTEGRATIONS_REVALIDATE_SECONDS } from "./siteIntegrations";
import { SITE_INTEGRATIONS_OFF, siteIntegrationsTag } from "./siteIntegrations.types";
import { checkSiteRefresh, siteRefreshSignature } from "./siteRefreshSignature";

const full = {
  host: "uae.swissarabian.com",
  brandCode: "SWISS_ARABIAN",
  marketCode: "URD1",
  analytics: { gtmContainerId: "GTM-ABC1234", ga4MeasurementId: null },
  insiderTag: { accountId: "10015366", scriptHost: "swissarabianuatnew.api.useinsider.com" },
  paymentPromos: { tabby: { merchantCode: "SAUAE", publicKey: "pk_test_abc" }, tamara: null },
  googleMaps: { browserKey: "AIzaSyTestKeyForSpecs-123", mapId: null },
};

describe("parseSiteIntegrations (backend answer → what the page may load)", () => {
  it("keeps a well-formed answer, inside or outside the response envelope", () => {
    const { host: _h, brandCode: _b, ...expected } = full;
    expect(parseSiteIntegrations({ success: true, data: full })).toEqual(expected);
    expect(parseSiteIntegrations(full)).toEqual(expected);
  });

  it("drops each malformed integration on its own, never rendering a bad value into a tag", () => {
    const parsed = parseSiteIntegrations({
      ...full,
      insiderTag: { accountId: "1\"><script>", scriptHost: "evil.example.com" },
      analytics: { gtmContainerId: "GTM-</script>", ga4MeasurementId: null },
    });
    expect(parsed.insiderTag).toBeNull();
    expect(parsed.analytics).toBeNull();
    expect(parsed.googleMaps).toEqual(full.googleMaps);
    expect(parsed.paymentPromos.tabby).toEqual(full.paymentPromos.tabby);
  });

  it("is all off for nonsense", () => {
    expect(parseSiteIntegrations(null)).toEqual(SITE_INTEGRATIONS_OFF);
    expect(parseSiteIntegrations("x")).toEqual(SITE_INTEGRATIONS_OFF);
  });
});

describe("loadSiteIntegrations", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    cacheCalls.length = 0;
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("asks the backend for the address and caches it under the address's tag", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: full }), { status: 200 }));
    const settings = await loadSiteIntegrations("UAE.swissarabian.com");
    expect(settings.insiderTag?.accountId).toBe("10015366");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/storefront\/site\/integrations$/);
    expect((init.headers as Record<string, string>)["x-storefront-host"]).toBe("uae.swissarabian.com");
    expect(cacheCalls[0].options).toEqual({
      revalidate: SITE_INTEGRATIONS_REVALIDATE_SECONDS,
      tags: [siteIntegrationsTag("uae.swissarabian.com")],
    });
  });

  it("is all off (not a default, not cached as off) when the backend is down", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 503 }));
    expect(await loadSiteIntegrations("uae.swissarabian.com")).toEqual(SITE_INTEGRATIONS_OFF);
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await loadSiteIntegrations("uae.swissarabian.com")).toEqual(SITE_INTEGRATIONS_OFF);
  });

  it("is all off for an unknown address or no address", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    expect(await loadSiteIntegrations("unknown.example.com")).toEqual(SITE_INTEGRATIONS_OFF);
    expect(await loadSiteIntegrations(null)).toEqual(SITE_INTEGRATIONS_OFF);
  });
});

describe("Refresh call from the backend (POST /api/site-config/revalidate)", () => {
  const SECRET = "s".repeat(40);
  const now = 1_800_000_000;
  const body = JSON.stringify({ hosts: ["UAE.swissarabian.com", "ksa.swissarabian.com"], reason: "x" });
  const signed = (ts = String(now), b = body, secret = SECRET) => ({
    secret: SECRET,
    timestamp: ts,
    signature: siteRefreshSignature(secret, ts, b),
    body: b,
    nowSeconds: now,
  });

  it("accepts a fresh call signed with the shared secret", () => {
    expect(checkSiteRefresh(signed())).toEqual({
      ok: true,
      hosts: ["uae.swissarabian.com", "ksa.swissarabian.com"],
    });
  });

  it("refuses a wrong secret, a tampered body, an old call and a missing secret", () => {
    expect(checkSiteRefresh(signed(String(now), body, "t".repeat(40)))).toMatchObject({ ok: false, status: 401 });
    expect(checkSiteRefresh({ ...signed(), body: body.replace("ksa", "kwt") })).toMatchObject({ ok: false, status: 401 });
    expect(checkSiteRefresh(signed(String(now - 301)))).toMatchObject({ ok: false, status: 401 });
    expect(checkSiteRefresh({ ...signed(), secret: undefined })).toMatchObject({ ok: false, status: 503 });
    expect(checkSiteRefresh({ ...signed(), signature: null })).toMatchObject({ ok: false, status: 401 });
  });

  it("refuses anything that is not a list of plain addresses", () => {
    const bad = JSON.stringify({ hosts: ["http://x.com/path"] });
    expect(checkSiteRefresh(signed(String(now), bad))).toMatchObject({ ok: false, status: 400 });
    const empty = JSON.stringify({ hosts: [] });
    expect(checkSiteRefresh(signed(String(now), empty))).toMatchObject({ ok: false, status: 400 });
  });

  it("expires exactly the named addresses' settings", async () => {
    vi.stubEnv("SITE_REVALIDATE_SECRET", SECRET);
    revalidateTag.mockClear();
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await POST(
      new Request("http://localhost/api/site-config/revalidate", {
        method: "POST",
        headers: { "x-site-timestamp": ts, "x-site-signature": siteRefreshSignature(SECRET, ts, body) },
        body,
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: 2 });
    expect(revalidateTag.mock.calls).toEqual([
      [siteIntegrationsTag("uae.swissarabian.com"), { expire: 0 }],
      [siteIntegrationsTag("ksa.swissarabian.com"), { expire: 0 }],
    ]);

    revalidateTag.mockClear();
    const refused = await POST(
      new Request("http://localhost/api/site-config/revalidate", { method: "POST", body }),
    );
    expect(refused.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
