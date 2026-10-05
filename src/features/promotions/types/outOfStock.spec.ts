import { describe, expect, it } from "vitest";
import { readOutOfStock } from "./outOfStock";

describe("out of stock reader", () => {
  it("keeps the server sentence and does not invent a notify button", () => {
    const state = readOutOfStock({
      outOfStock: true,
      message: "This piece is out of stock.",
      notify: { available: false },
      heading: "Other Men are still in stock.",
      addLabel: "Add",
      campaignCode: "SET25",
      products: [{ sku: "MEN1", title: "Wajd", price: "AED 190.00", slug: "wajd", image: null }],
      targetType: "CATEGORY",
    });
    expect(state.notifyAvailable).toBe(false);
    expect(state.heading).toBe("Other Men are still in stock.");
    expect(state.products[0]?.price).toBe("AED 190.00");
    expect(JSON.stringify(state)).not.toMatch(/targetType|Notify me|waitlist/);
  });

  it("drops a heading when no product can satisfy it", () => {
    const state = readOutOfStock({
      outOfStock: true,
      message: "This piece is out of stock.",
      notify: { available: false },
      heading: "Other Men are still in stock.",
      products: [],
    });
    expect(state.heading).toBeNull();
    expect(state.products).toEqual([]);
  });
});
