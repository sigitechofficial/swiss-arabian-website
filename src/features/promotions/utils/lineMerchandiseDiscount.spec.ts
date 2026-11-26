import { describe, expect, it } from "vitest";
import type { PromotionSnapshotV1 } from "../types/promotions";
import { lineMerchandiseDiscount, linePrices } from "./lineMerchandiseDiscount";

const snapshot = {
  lineAllocations: [
    { ref: "jamila", sku: "JAMILA", amount: "20.00" },
    { ref: "other", sku: "OTHER", amount: "5.00" },
  ],
} as PromotionSnapshotV1;

describe("line merchandise discount", () => {
  it("uses the quote amount for that cart line", () => {
    expect(lineMerchandiseDiscount(snapshot, { cartItemId: "jamila", sku: "JAMILA" }, "AED")).toBe(20);
    expect(lineMerchandiseDiscount(snapshot, { cartItemId: "missing", sku: "JAMILA" }, "AED")).toBe(0);
  });

  it("keeps the list price and the price after that discount", () => {
    expect(linePrices(80, 20, "AED")).toEqual({ list: 80, sale: 60 });
    expect(linePrices(80, 0, "AED")).toEqual({ list: 80, sale: null });
  });

  it("rounds to the currency's own minor units", () => {
    expect(linePrices(30.3606, 0.0006, "KWD")).toEqual({ list: 30.361, sale: 30.36 });
    expect(linePrices(30.3606, 0.0006, "AED")).toEqual({ list: 30.36, sale: null });
  });
});
