import { describe, expect, it } from "vitest";
import { payInFour } from "./PdpInstalments";

describe("pay in four", () => {
  it("splits an even price into four equal payments", () => {
    expect(payInFour(110)).toEqual([27.5, 27.5, 27.5, 27.5]);
  });

  it("puts the leftover cents on the last payment so the four add up to the price", () => {
    const payments = payInFour(320.25);
    expect(payments).toEqual([80.06, 80.06, 80.06, 80.07]);
    expect(Math.round(payments.reduce((sum, value) => sum + value, 0) * 100)).toBe(32025);
  });

  it("never loses a cent on awkward prices", () => {
    for (const price of [0.01, 9.99, 99.99, 247.5, 1234.57]) {
      const cents = payInFour(price).reduce((sum, value) => sum + Math.round(value * 100), 0);
      expect(cents).toBe(Math.round(price * 100));
    }
  });
});
