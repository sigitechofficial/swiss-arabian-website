import { describe, expect, it } from "vitest";
import { readCompanionPreview, readProductCompanions } from "./companions";

describe("product companions", () => {
  it("keeps a heading only when products survive", () => {
    const parsed = readProductCompanions({
      current: { productId: "p1", sku: "AAA", title: "Wajd", price: "AED 190.00", inStock: true },
      groups: [
        { id: "range", heading: "More from Shaghaf.", seeAllPath: "/collections/shaghaf", products: [
          { productId: "p2", sku: "BBB", title: "Oud", price: "AED 100.00", inStock: true },
        ] },
        { id: "pairs", heading: "Pairs well with.", products: [{ sku: "NOID" }] },
      ],
      copy: { addSelected: "Add selected" },
    });
    expect(parsed.groups.map((group) => group.heading)).toEqual(["More from Shaghaf."]);
    expect(parsed.current?.sku).toBe("AAA");
    expect(JSON.stringify(parsed)).not.toContain("also bought");
  });

  it("reads the server quote without inventing a saving", () => {
    expect(readCompanionPreview({
      beforeSavings: "AED 190.00",
      promotionSaving: null,
      yourTotal: "AED 190.00",
      message: "No extra saving on this selection.",
      readyToAdd: true,
    }).promotionSaving).toBeNull();
  });
});
