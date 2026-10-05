import { describe, expect, it } from "vitest";
import { readEmptyBag } from "./emptyBag";

describe("empty bag reader", () => {
  it("keeps a start row and drops a heading with no products", () => {
    const bag = readEmptyBag({
      addLabel: "Add",
      groups: [
        {
          id: "start",
          heading: "Start your bundle.",
          campaignCode: "SET25",
          products: [{ sku: "SHA", title: "Shaheen", price: "AED 130.00", slug: "DSHA", image: null }],
          targetType: "CATEGORY",
        },
        { id: "viewed", heading: "Recently viewed.", products: [] },
      ],
    });
    expect(bag.groups.map((group) => group.heading)).toEqual(["Start your bundle."]);
    expect(bag.groups[0]?.products[0]?.price).toBe("AED 130.00");
    expect(JSON.stringify(bag)).not.toMatch(/targetType|also bought/);
  });
});
