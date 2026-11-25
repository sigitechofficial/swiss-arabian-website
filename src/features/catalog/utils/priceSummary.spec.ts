import { describe, expect, it } from "vitest";
import { readPriceCurrency, readSellingPrice } from "./priceSummary";

describe("readSellingPrice — the backend's price rule (A26)", () => {
  it("shows the price only when the market says it is valid", () => {
    expect(readSellingPrice({ price: "10.120", currencyCode: "KWD", hasValidPrice: true })).toBe(10.12);
    // A price without the valid flag is what the bag refuses: the card must not offer it.
    expect(readSellingPrice({ price: "10.120", currencyCode: "KWD", hasValidPrice: false })).toBeNull();
    expect(readSellingPrice({ price: "10.120", currencyCode: "KWD" })).toBeNull();
  });

  it("treats zero, negative and unreadable amounts as no price", () => {
    expect(readSellingPrice({ price: "0", hasValidPrice: true })).toBeNull();
    expect(readSellingPrice({ price: "-1", hasValidPrice: true })).toBeNull();
    expect(readSellingPrice({ price: "abc", hasValidPrice: true })).toBeNull();
    expect(readSellingPrice({ price: null, hasValidPrice: true })).toBeNull();
    expect(readSellingPrice(null)).toBeNull();
  });

  it("can read the amount from another field of the same summary", () => {
    expect(readSellingPrice({ hasValidPrice: true }, "63")).toBe(63);
    expect(readSellingPrice({ hasValidPrice: false }, "63")).toBeNull();
  });

  it("reads the currency code", () => {
    expect(readPriceCurrency({ currencyCode: " kwd " })).toBe("KWD");
    expect(readPriceCurrency({ currencyCode: "" })).toBeNull();
    expect(readPriceCurrency(undefined)).toBeNull();
  });
});
