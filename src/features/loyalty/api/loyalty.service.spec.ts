import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { useUiStore } from "@/stores/useUiStore";
import {
  fetchLoyaltyTierHistory,
  fetchLoyaltyTransactions,
  fetchLoyaltyWallet,
  requestOmnichannelRefresh,
} from "./loyalty.service";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  useUiStore.setState({
    catalogContext: {
      zoneCode: "QA",
      currencyCode: "QAR",
      languageCode: "en",
      salesChannelCode: "platform_sa_qa",
      brandId: "brand-should-not-be-sent",
      brandCode: "SWISS_ARABIAN",
    },
  });
});

describe("loyalty requests", () => {
  it("loads the current market wallet without a brand or customer id", async () => {
    apiGet.mockResolvedValue({
      wallet: { availablePoints: 0, currencyCode: "QAR" },
      market: { zoneCode: "QA", currencyCode: "QAR" },
    });
    const wallet = await fetchLoyaltyWallet({ zoneCode: "QA", currencyCode: "QAR" });
    const path = String(apiGet.mock.calls[0]?.[0]);
    expect(path.startsWith("/storefront/loyalty/me?")).toBe(true);
    expect(path).toContain("zoneCode=QA");
    expect(path).toContain("currencyCode=QAR");
    expect(path).not.toContain("brandId");
    expect(path).not.toContain("brandCode");
    expect(path).not.toContain("customerId");
    expect(wallet.availablePoints).toBe(0);
    expect(wallet.currencyCode).toBe("QAR");
  });

  it("loads transactions for the same market", async () => {
    apiGet.mockResolvedValue({ items: [] });
    const page = await fetchLoyaltyTransactions({ zoneCode: "QA", currencyCode: "QAR" });
    const path = String(apiGet.mock.calls[0]?.[0]);
    expect(path.startsWith("/storefront/loyalty/transactions?")).toBe(true);
    expect(path).toContain("zoneCode=QA");
    expect(path).not.toContain("customerId");
    expect(page.platformActivity).toEqual([]);
    expect(page.externalActivity).toEqual([]);
  });

  it("requests an independent external activity offset", async () => {
    apiGet.mockResolvedValue({
      items: [],
      externalActivity: [],
      externalPageInfo: { total: 40, limit: 20, offset: 20, hasMore: true },
    });
    await fetchLoyaltyTransactions({ zoneCode: "QA", currencyCode: "QAR" }, { limit: 20, offset: 20 });
    const path = String(apiGet.mock.calls[0]?.[0]);
    expect(path).toContain("offset=20");
    expect(path).toContain("limit=20");
  });

  it("queues an omnichannel refresh without identity in the body", async () => {
    apiPost.mockResolvedValue({
      status: "QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
    const result = await requestOmnichannelRefresh({ zoneCode: "QA", currencyCode: "QAR" });
    expect(result.status).toBe("QUEUED");
    expect(apiPost).toHaveBeenCalledTimes(1);
    const [path, body] = apiPost.mock.calls[0] ?? [];
    expect(String(path).startsWith("/storefront/loyalty/omnichannel/refresh?")).toBe(true);
    expect(path).toContain("zoneCode=QA");
    expect(path).toContain("currencyCode=QAR");
    expect(path).toContain("languageCode=en");
    expect(path).toContain("salesChannelCode=platform_sa_qa");
    expect(path).not.toContain("customerId");
    expect(path).not.toContain("phone");
    expect(path).not.toContain("cardNumber");
    expect(path).not.toContain("mappingId");
    expect(body).toBeUndefined();
  });

  it.each(["QUEUED", "ALREADY_QUEUED", "THROTTLED", "NOT_READY", "DISABLED"] as const)(
    "accepts HTTP 200 %s as a refresh result",
    async (status) => {
      apiPost.mockResolvedValue({
        status,
        refreshRequestedAt: "2026-10-15T08:01:00.000Z",
        retryAfterSeconds: status === "THROTTLED" ? 12 : null,
      });
      const result = await requestOmnichannelRefresh({ zoneCode: "QA", currencyCode: "QAR" });
      expect(result.status).toBe(status);
    },
  );

  it("rethrows a real 401 so session handling runs", async () => {
    const expired = new ApiClientError(401, "Your session has expired. Please sign in again.");
    apiPost.mockRejectedValue(expired);
    await expect(requestOmnichannelRefresh({ zoneCode: "QA", currencyCode: "QAR" })).rejects.toBe(
      expired,
    );
  });

  it("rethrows an unexpected 500 without inventing a refresh status", async () => {
    const boom = new ApiClientError(500, "Request failed");
    apiPost.mockRejectedValue(boom);
    await expect(requestOmnichannelRefresh({ zoneCode: "QA", currencyCode: "QAR" })).rejects.toBe(boom);
  });

  it("loads tier history for the same market", async () => {
    apiGet.mockResolvedValue({ items: [] });
    await fetchLoyaltyTierHistory({ zoneCode: "QA", currencyCode: "QAR" });
    const path = String(apiGet.mock.calls[0]?.[0]);
    expect(path.startsWith("/storefront/loyalty/tier-history?")).toBe(true);
    expect(path).toContain("zoneCode=QA");
    expect(path).not.toContain("customerId");
  });
});
