import { describe, expect, it } from "vitest";
import { payInFour, usesTamaraWidget } from "./PdpInstalments";

describe("pay in four", () => {
  it("splits an even price into four equal payments", () => {
    expect(payInFour(110, "AED")).toEqual([27.5, 27.5, 27.5, 27.5]);
  });

  it("puts the leftover cents on the last payment so the four add up to the price", () => {
    const payments = payInFour(320.25, "AED");
    expect(payments).toEqual([80.06, 80.06, 80.06, 80.07]);
    expect(Math.round(payments.reduce((sum, value) => sum + value, 0) * 100)).toBe(32025);
  });

  it("never loses a cent on awkward prices", () => {
    for (const price of [0.01, 9.99, 99.99, 247.5, 1234.57]) {
      const cents = payInFour(price, "AED").reduce((sum, value) => sum + Math.round(value * 100), 0);
      expect(cents).toBe(Math.round(price * 100));
    }
  });

  it("splits to the fils for three-decimal currencies", () => {
    const payments = payInFour(10.125, "KWD");
    expect(payments).toEqual([2.531, 2.531, 2.531, 2.532]);
    expect(payments.reduce((sum, value) => sum + Math.round(value * 1000), 0)).toBe(10125);
  });
});

describe("tamara widget on the product page", () => {
  it("is used only when Tamara is live, has a key and covers the currency", () => {
    expect(usesTamaraWidget("AED", true, "pk")).toBe(true);
    expect(usesTamaraWidget("sar", true, "pk")).toBe(true);
    expect(usesTamaraWidget("AED", false, "pk")).toBe(false);
    expect(usesTamaraWidget("AED", true, "")).toBe(false);
    expect(usesTamaraWidget("KWD", true, "pk")).toBe(false);
  });
});
