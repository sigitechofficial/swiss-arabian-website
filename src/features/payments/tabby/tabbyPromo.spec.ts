import { describe, expect, it } from "vitest";
import { toDecimalString } from "@/lib/format/money";
import { tabbyPromoConfig } from "./tabbyPromo";

const keys = { merchantCode: "swissarabian_web_uae", publicKey: "pk_test_x" };

describe("tabbyPromoConfig", () => {
  it("uses the market's keys and Tabby's host for the currency", () => {
    expect(tabbyPromoConfig(keys, 230, "aed")).toEqual({
      ...keys,
      currency: "AED",
      scriptBase: "https://checkout.tabby.ai",
    });
    expect(tabbyPromoConfig(keys, 230, "SAR")?.scriptBase).toBe("https://checkout.tabby.sa");
  });

  it("shows nothing where the market has no Tabby, a key is missing, or nothing is due", () => {
    expect(tabbyPromoConfig(null, 230, "AED")).toBeNull();
    expect(tabbyPromoConfig({ ...keys, publicKey: null }, 230, "AED")).toBeNull();
    expect(tabbyPromoConfig({ ...keys, merchantCode: null }, 230, "AED")).toBeNull();
    expect(tabbyPromoConfig(keys, 0, "AED")).toBeNull();
    expect(tabbyPromoConfig(keys, 230, "QAR")).toBeNull();
  });

  it("formats Tabby's price with the currency's decimals", () => {
    expect(toDecimalString(99.5, "AED")).toBe("99.50");
    expect(toDecimalString(9.5, "KWD")).toBe("9.500");
  });
});
