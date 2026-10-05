import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUiStore } from "@/stores/useUiStore";
import { fetchLoyaltyTransactions, fetchLoyaltyWallet } from "./loyalty.service";

const apiGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
}));

beforeEach(() => {
  apiGet.mockReset();
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
    await fetchLoyaltyTransactions({ zoneCode: "QA", currencyCode: "QAR" });
    const path = String(apiGet.mock.calls[0]?.[0]);
    expect(path.startsWith("/storefront/loyalty/transactions?")).toBe(true);
    expect(path).toContain("zoneCode=QA");
    expect(path).not.toContain("customerId");
  });
});
