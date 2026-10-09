import { describe, expect, it } from "vitest";
import { mapCmsProduct, mapCmsProducts } from "./mapCmsProduct";

describe("mapCmsProduct", () => {
  it("maps sellable cards and drops missing slug", () => {
    const mapped = mapCmsProduct({
      productId: "p1",
      slug: "oud",
      name: "Oud",
      image: "https://cdn.example.com/o.jpg",
      isSellable: true,
      isVisible: true,
      priceSummary: { price: 250, currencyCode: "AED", hasValidPrice: true },
      inventorySummary: { hasAvailableInventory: true, availableQty: 3 },
    });
    expect(mapped?.id).toBe("p1");
    expect(mapped?.slug).toBe("oud");
    expect(mapped?.price).toBe(250);
    expect(mapped?.isSellable).toBe(true);

    expect(
      mapCmsProduct({
        productId: "p2",
        slug: null,
        name: "No slug",
      }),
    ).toBeNull();
  });

  it("filters array input", () => {
    const list = mapCmsProducts([
      {
        productId: "p1",
        slug: "a",
        name: "A",
        isSellable: true,
        priceSummary: { price: 10, currencyCode: "AED", hasValidPrice: true },
      },
      null,
      { productId: "p2", name: "No slug" },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe("a");
  });
});
