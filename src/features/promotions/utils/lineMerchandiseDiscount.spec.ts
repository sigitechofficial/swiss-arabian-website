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
    expect(lineMerchandiseDiscount(snapshot, { cartItemId: "jamila", sku: "JAMILA" })).toBe(20);
    expect(lineMerchandiseDiscount(snapshot, { cartItemId: "missing", sku: "JAMILA" })).toBe(0);
  });

  it("keeps the list price and the price after that discount", () => {
    expect(linePrices(80, 20)).toEqual({ list: 80, sale: 60 });
    expect(linePrices(80, 0)).toEqual({ list: 80, sale: null });
  });
});
