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
  toInsiderPurchaseValue,
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

  it("sends purchase + init with Web SDK value fields", () => {
    insiderPurchasePage({
      order_id: "SA-1001",
      total: 199.5,
      quantity: 2,
      items: [
        {
          id: "var-1",
          name: "Oud",
          taxonomy: [],
          unit_price: 99.75,
          unit_sale_price: 99.75,
          quantity: 2,
          url: "https://example.com/products/SKU-1",
          product_image_url: "",
        },
      ],
    });
    const rows = window.InsiderQueue ?? [];
    expect(rows.map((row) => row.type)).toEqual(["purchase", "init"]);
    const purchase = rows[0]?.value as Record<string, unknown>;
    expect(purchase.order_id).toBe("SA-1001");
    expect(purchase.total).toBe(199.5);
    expect(purchase.quantity).toBe(2);
    expect(Array.isArray(purchase.items)).toBe(true);
    expect((purchase.items as unknown[]).length).toBe(1);
  });
});

describe("toInsiderPurchaseValue", () => {
  it("always returns numeric totals and an items array", () => {
    const value = toInsiderPurchaseValue({
      orderId: "ord-1",
      total: "120.00",
      shipping: "10",
      lines: [
        {
          sku: "SKU-1",
          variantId: "var-1",
          productName: "Oud",
          quantity: "2",
          unitPrice: "55",
        },
      ],
    });
    expect(value.order_id).toBe("ord-1");
    expect(value.total).toBe(120);
    expect(value.quantity).toBe(2);
    expect(value.shipping_cost).toBe(10);
    expect(Array.isArray(value.items)).toBe(true);
    expect(value.items[0]).toMatchObject({
      id: "var-1",
      name: "Oud",
      quantity: 2,
      unit_price: 55,
    });
  });
});
