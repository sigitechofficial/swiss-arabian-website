import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
const apiPut = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
  apiPut: (...args: unknown[]) => apiPut(...args),
}));

import { getSubscriptionConsent, listPlanProducts, listSubscriptionPlans, registerSubscription } from "./subscription.api";

describe("subscription api", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
  });

  it("loads published plans for the current zone without a customer token", async () => {
    apiGet.mockResolvedValue({ items: [] });
    await listSubscriptionPlans("KSA");
    expect(apiGet).toHaveBeenCalledWith(
      "/storefront/subscription-plans?zoneCode=KSA",
      { skipAuth: true },
    );
  });

  it("sends the customer call with the same idempotency key", async () => {
    apiPost.mockResolvedValue({ id: "sub-1", status: "PENDING_ACTIVATION" });
    const body = {
      zoneCode: "UAE",
      planCode: "MONTHLY_65",
      mode: "SURPRISE" as const,
      audience: "MEN" as const,
      customerAddressId: "addr",
      consentTextVersion: "from-legal",
    };
    await registerSubscription(body, "key-1");
    await registerSubscription(body, "key-1");
    expect(apiPost).toHaveBeenNthCalledWith(1, "/storefront/subscriptions", body, {
      headers: { "Idempotency-Key": "key-1" },
    });
    expect(apiPost).toHaveBeenNthCalledWith(2, "/storefront/subscriptions", body, {
      headers: { "Idempotency-Key": "key-1" },
    });
    expect(apiPost).not.toHaveBeenCalledWith(
      expect.stringMatching(/payment|order|checkout/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it("asks the audience-filtered product list for the current market", async () => {
    apiGet.mockResolvedValue({ items: [] });
    await listPlanProducts("MONTHLY_65", "KSA", "WOMEN");
    expect(apiGet).toHaveBeenCalledWith(
      "/storefront/subscription-plans/MONTHLY_65/products?zoneCode=KSA&audience=WOMEN",
      { skipAuth: true },
    );
  });

  it("reads the published consent for the current zone without a customer token", async () => {
    apiGet.mockResolvedValue({
      available: true,
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    await expect(getSubscriptionConsent("UAE")).resolves.toEqual({
      available: true,
      version: "market-live-1",
      text: "Exact published wording.",
      publishedAt: "2026-10-20T09:00:00.000Z",
    });
    expect(apiGet).toHaveBeenCalledWith("/storefront/subscription-consent?zoneCode=UAE", {
      skipAuth: true,
    });
  });
});
