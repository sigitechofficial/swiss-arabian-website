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
  beginInsiderRouteFlush,
  insiderCartPage,
  insiderCheckoutPage,
  insiderHomePage,
  insiderIdentify,
  insiderListingPage,
  insiderOtherPage,
  insiderProductViewed,
  insiderPurchasePage,
  pushInsiderUserContext,
  resetInsiderRouteFlushForTests,
  toInsiderPurchaseValue,
} from "@/lib/insider";

describe("Insider page-view queues", () => {
  beforeEach(() => {
    window.InsiderQueue = [];
    window.Insider = { initialized: true };
    resetInsiderRouteFlushForTests();
    localStorage.clear();
  });

  it("sends documented page types, with checkout as other + init", () => {
    insiderHomePage();
    insiderListingPage({ breadcrumb: "bundles" });
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
    const listing = (window.InsiderQueue ?? []).find(
      (row) => row.type === "category",
    );
    expect(listing?.value).toEqual({ breadcrumb: ["bundles"] });
    expect(
      (listing?.value as { items?: unknown }).items,
    ).toBeUndefined();
    const others = (window.InsiderQueue ?? []).filter(
      (row) => row.type === "other",
    );
    expect(others[0]?.value).toEqual({ name: "Checkout" });
    expect(others[1]?.value).toEqual({ name: "Page" });
  });

  it("keeps cart line items off listing so category is not sent with products", () => {
    pushInsiderUserContext({
      omitCartItems: true,
      cart: {
        total: 50,
        items: [
          {
            id: "var-1",
            sku: "SKU-1",
            name: "Oud",
            price: 50,
            currency: "AED",
            quantity: 1,
          },
        ],
      },
    });
    insiderListingPage({ breadcrumb: "Shop" });
    const cart = (window.InsiderQueue ?? []).find((row) => row.type === "cart");
    expect((cart?.value as { items: unknown[] }).items).toEqual([]);
    const listing = (window.InsiderQueue ?? []).find(
      (row) => row.type === "category",
    );
    expect(listing?.value).toEqual({ breadcrumb: ["Shop"] });
  });

  it("sends user, currency, and basket cart before a page init", () => {
    pushInsiderUserContext({
      cart: { total: 0, items: [] },
    });
    insiderHomePage();
    const types = (window.InsiderQueue ?? []).map((row) => row.type);
    expect(types).toEqual([
      "user",
      "currency",
      "cart",
      "home",
      "init",
    ]);
    expect(types.filter((type) => type === "init")).toHaveLength(1);
    expect(types).not.toContain("language");
    const user = (window.InsiderQueue ?? []).find((row) => row.type === "user");
    expect((user?.value as { language?: string }).language).toBe("en_US");
    expect((user?.value as { custom?: unknown }).custom).toBeUndefined();
    expect(
      (window.InsiderQueue ?? []).find((row) => row.type === "currency")?.value,
    ).toBe("AED");
    const cart = (window.InsiderQueue ?? []).find((row) => row.type === "cart");
    expect(cart?.value).toMatchObject({
      total: 0,
      subtotal: 0,
      shipping_cost: 0,
      quantity: 0,
    });
    expect(Array.isArray((cart?.value as { items?: unknown }).items)).toBe(
      true,
    );
  });

  it("does not push a second init when identifying a logged-in user", () => {
    insiderHomePage();
    insiderIdentify({ uuid: "cust-1", email: "a@b.com" });
    expect(
      (window.InsiderQueue ?? []).filter((row) => row.type === "init"),
    ).toHaveLength(1);
    expect(
      (window.InsiderQueue ?? []).some((row) => row.type === "user"),
    ).toBe(true);
  });

  it("allows only one route flush per pathname", () => {
    expect(beginInsiderRouteFlush("/")).toBe(true);
    expect(beginInsiderRouteFlush("/")).toBe(false);
    expect(beginInsiderRouteFlush("/products")).toBe(true);
  });

  it("omits empty optional product fields and defaults taxonomy", () => {
    insiderProductViewed({
      id: "var-1",
      sku: "SKU-1",
      name: "Oud",
      price: 199,
      currency: "AED",
      stock: 4,
      size: "75 ml",
      groupcode: "prod-1",
    });
    const product = (window.InsiderQueue ?? []).find(
      (row) => row.type === "product",
    )?.value as Record<string, unknown>;
    expect(product.taxonomy).toEqual(["Shop"]);
    expect(product.stock).toBe(4);
    expect(product.size).toBe("75 ml");
    expect(product.groupcode).toBe("prod-1");
    expect(product.color).toBeUndefined();
    expect(product.sku).toBeUndefined();
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
