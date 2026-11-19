import { describe, expect, it } from "vitest";
import { describeOrderChanges } from "./orderChanges";

type Q = Parameters<typeof describeOrderChanges>[0];

function quote(
  items: { sku: string; price: string }[],
  total: string,
  offers: string[] = [],
  amountPayable?: string,
): Q {
  return {
    currency: "AED",
    items: items.map((item) => ({
      cartItemId: item.sku,
      sku: item.sku,
      productId: null,
      variantId: null,
      quantity: "1",
      unitPriceEstimate: item.price,
      lineSubtotalEstimate: item.price,
    })),
    totalsEstimate: {
      subtotal: total,
      discount: "0",
      shipping: "16",
      tax: "0",
      total,
      amountPayable: amountPayable ?? total,
    },
    promotions: {
      applied: offers.map((label) => ({ kind: "AUTOMATIC", code: null, label, amount: "10" })),
    } as unknown as Q["promotions"],
  };
}

const names = (sku: string) => ({ SOUD: "Secret Oud", GHAR: "Gharaam" })[sku] ?? sku;

describe("describeOrderChanges (QA-048)", () => {
  it("an offer ended: lists it and the new total", () => {
    const changes = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }], "106", ["10% off"]),
      quote([{ sku: "SOUD", price: "100" }], "116"),
      names,
    );
    expect(changes.offersEnded).toEqual(["10% off"]);
    expect(changes.total).toEqual({ from: 106, to: 116 });
    expect(changes.removed).toEqual([]);
    expect(changes.nothingOrderable).toBe(false);
  });

  it("a price changed: lists the item with old and new price", () => {
    const changes = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }], "116"),
      quote([{ sku: "SOUD", price: "120" }], "136"),
      names,
    );
    expect(changes.repriced).toEqual([
      { sku: "SOUD", name: "Secret Oud", from: 100, to: 120 },
    ]);
  });

  it("an item went out of stock: it is listed as left out", () => {
    const changes = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }, { sku: "GHAR", price: "111" }], "227"),
      quote([{ sku: "GHAR", price: "111" }], "127"),
      names,
    );
    expect(changes.removed).toEqual([{ sku: "SOUD", name: "Secret Oud" }]);
    expect(changes.nothingOrderable).toBe(false);
  });

  it("nothing can be ordered any more", () => {
    const changes = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }], "116"),
      null,
      names,
    );
    expect(changes.removed).toEqual([{ sku: "SOUD", name: "Secret Oud" }]);
    expect(changes.nothingOrderable).toBe(true);
  });

  it("shows the amount to pay only when a gift card or points apply", () => {
    const withCard = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }], "106", ["10% off"], "56"),
      quote([{ sku: "SOUD", price: "100" }], "116", [], "66"),
      names,
    );
    expect(withCard.amountPayable).toEqual({ from: 56, to: 66 });
    const plain = describeOrderChanges(
      quote([{ sku: "SOUD", price: "100" }], "106", ["10% off"]),
      quote([{ sku: "SOUD", price: "100" }], "116"),
      names,
    );
    expect(plain.amountPayable).toBeNull();
  });
});
