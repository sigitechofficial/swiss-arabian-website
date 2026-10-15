import { describe, expect, it } from "vitest";
import { payInFour, tabbyPopupUrl } from "./PdpInstalments";

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

describe("tabby pop-up address", () => {
  const noKeys = { publicKey: "", merchantCode: "" };

  it("points at Tabby's own page with the price and currency", () => {
    expect(tabbyPopupUrl(110, "AED", "en", noKeys)).toBe(
      "https://checkout.tabby.ai/promos/product-page/installments/en/?price=110.00&currency=AED",
    );
  });

  it("uses the Saudi address and the Arabic page for a riyal price in Arabic", () => {
    expect(tabbyPopupUrl(99.5, "sar", "ar", noKeys)).toBe(
      "https://checkout.tabby.sa/promos/product-page/installments/ar/?price=99.50&currency=SAR",
    );
  });

  it("adds the merchant details once they are set", () => {
    const url = new URL(tabbyPopupUrl(110, "AED", "en", { publicKey: "pk_test_1", merchantCode: "SAUAE" })!);
    expect(url.searchParams.get("public_key")).toBe("pk_test_1");
    expect(url.searchParams.get("merchant_code")).toBe("SAUAE");
  });

  it("has no Tabby page for a currency Tabby does not cover", () => {
    expect(tabbyPopupUrl(110, "QAR", "en", noKeys)).toBeNull();
  });
});
