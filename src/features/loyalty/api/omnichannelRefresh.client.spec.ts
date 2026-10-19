import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/config/env";
import { setTokens, clearTokens } from "@/lib/auth/token";
import { useUiStore } from "@/stores/useUiStore";
import { requestOmnichannelRefresh } from "./loyalty.service";

describe("omnichannel refresh authenticated client", () => {
  const calls: Array<[string, RequestInit | undefined]> = [];

  beforeEach(() => {
    calls.length = 0;
    useUiStore.setState({
      catalogContext: {
        zoneCode: "UAE",
        currencyCode: "AED",
        languageCode: "en",
        countryCode: "AE",
        salesChannelCode: "platform_sa_uae",
      },
    });
    setTokens("test-access-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: RequestInit) => {
        calls.push([String(input), init]);
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              status: "QUEUED",
              refreshRequestedAt: "2026-10-15T08:01:00.000Z",
              retryAfterSeconds: null,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  });

  afterEach(() => {
    clearTokens();
    useUiStore.setState({ catalogContext: null });
    vi.unstubAllGlobals();
  });

  it("POSTs through apiClient with Bearer auth, market query, and no identity body", async () => {
    const result = await requestOmnichannelRefresh({ zoneCode: "UAE", currencyCode: "AED" });
    expect(result.status).toBe("QUEUED");
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0] ?? [];
    expect(init?.method).toBe("POST");
    expect(url).toBe(
      `${env.apiBaseUrl}/storefront/loyalty/omnichannel/refresh?zoneCode=UAE&languageCode=en&currencyCode=AED&countryCode=AE&salesChannelCode=platform_sa_uae`,
    );
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-access-token");
    expect(init?.body).toBeUndefined();
    expect(url).not.toContain("customerId");
    expect(url).not.toContain("phone");
    expect(url).not.toContain("cardNumber");
    expect(url).not.toContain("mappingId");
  });
});
