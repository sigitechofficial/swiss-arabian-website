import { describe, expect, it } from "vitest";
import { cartCurrency } from "./cartCurrency";

describe("cartCurrency", () => {
  it("prefers the cart totals, then the lines, then the market", () => {
    expect(
      cartCurrency({
        totalsCurrency: "SAR",
        lines: [{ currency: "QAR" }],
        marketCurrency: "AED",
      }),
    ).toBe("SAR");
    expect(
      cartCurrency({
        totalsCurrency: null,
        lines: [{ currency: "QAR" }],
        marketCurrency: "AED",
      }),
    ).toBe("QAR");
    expect(cartCurrency({ lines: [], marketCurrency: "QAR" })).toBe("QAR");
  });
});
