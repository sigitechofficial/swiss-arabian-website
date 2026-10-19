import { afterEach, describe, expect, it } from "vitest";
import { queryClient } from "@/lib/api/queryClient";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { refreshCustomerScopedCaches } from "./sessionCache";

afterEach(() => {
  queryClient.clear();
});

describe("customer-scoped cache refresh", () => {
  it("drops guest Promotion discovery so sign-in refetches Backend eligibility", () => {
    const key = promotionKeys.discovery("UAE", "guest", "oud");
    queryClient.setQueryData(key, { offers: [{ campaignCode: "MEMBER5" }] });
    queryClient.setQueryData(loyaltyKeys.wallet("UAE", "AED"), { availablePoints: 1 });
    refreshCustomerScopedCaches();
    expect(queryClient.getQueryData(key)).toBeUndefined();
    expect(queryClient.getQueryData(loyaltyKeys.wallet("UAE", "AED"))).toBeUndefined();
  });
});
