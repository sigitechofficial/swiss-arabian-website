import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: {
    insider: {
      enabled: true,
      accountId: "10015366",
      scriptHost: "swissarabianuatnew.api.useinsider.com",
    },
  },
}));

import {
  insiderCartPage,
  insiderCheckoutPage,
  insiderHomePage,
  insiderListingPage,
  insiderOtherPage,
  insiderProductViewed,
  insiderPurchasePage,
} from "@/lib/insider";

describe("Insider page-view queues", () => {
  beforeEach(() => {
    window.InsiderQueue = [];
    window.Insider = { initialized: true };
  });

  it("sends documented page types, with checkout as other + init", () => {
    insiderHomePage();
    insiderListingPage({ taxonomy: "bundles" });
    insiderProductViewed({
      id: "var-1",
      sku: "SKU-1",
      name: "Oud",
      price: 199,
      currency: "AED",
    });
    insiderCartPage({ total: 199, items: [] });
    insiderCheckoutPage();
    insiderOtherPage();

    const types = (window.InsiderQueue ?? []).map((row) => row.type);
    expect(types).toEqual([
      "home",
      "init",
      "category",
      "init",
      "product",
      "init",
      "cart",
      "init",
      "other",
      "init",
      "other",
      "init",
    ]);
    expect(types).not.toContain("checkout");
    expect(types).not.toContain("user_register");
  });

  it("sends purchase + init on the thank-you page helper", () => {
    insiderPurchasePage();
    expect((window.InsiderQueue ?? []).map((row) => row.type)).toEqual([
      "purchase",
      "init",
    ]);
  });
});
