import { describe, expect, it } from "vitest";
import { historicalLineDiscount } from "./historicalLineDiscount";

describe("historical line discount", () => {
  it("ignores a legacy line with no snapshot", () => {
    expect(historicalLineDiscount(null)).toBeNull();
    expect(historicalLineDiscount(undefined)).toBeNull();
  });

  it("reads the stored discount total", () => {
    expect(historicalLineDiscount({ v: 1, discountTotal: "20.00" })).toBe(20);
  });

  it("uses discountTotal for a BXGY allocation and ignores the code", () => {
    const amount = historicalLineDiscount({
      v: 1,
      discountTotal: "50.00",
      allocations: [{ kind: "COUPON", code: "EID3FOR2", discountType: "BUY_X_GET_Y", amount: "50.00" }],
    });
    expect(amount).toBe(50);
  });

  it("does not sum allocations when discountTotal is the combined figure", () => {
    expect(
      historicalLineDiscount({
        v: 1,
        discountTotal: "30.00",
        allocations: [
          { kind: "AUTOMATIC", code: "PROD", discountType: "FIXED_AMOUNT", amount: "10.00" },
          { kind: "COUPON", code: "ORDER20", discountType: "PERCENTAGE", amount: "20.00" },
        ],
      }),
    ).toBe(30);
  });

  it("skips an unknown snapshot version", () => {
    expect(historicalLineDiscount({ v: 2, discountTotal: "20.00" })).toBeNull();
    expect(historicalLineDiscount({ discountTotal: "20.00" })).toBeNull();
    expect(historicalLineDiscount("20.00")).toBeNull();
  });
});
