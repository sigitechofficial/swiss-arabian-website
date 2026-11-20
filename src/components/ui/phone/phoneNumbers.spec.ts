import { describe, expect, it } from "vitest";
import { exampleForNumber, exampleNationalNumber, formatPhoneNumber, isValidMobile, toE164 } from "./usePhoneNumberField";

describe("phone number helpers", () => {
  it("builds E.164 from the picker country, dropping a repeated dial code or trunk zero", () => {
    expect(toE164("AE", "501234567")).toBe("+971501234567");
    expect(toE164("AE", "971501234567")).toBe("+971501234567");
    expect(toE164("AE", "0501234567")).toBe("+971501234567");
    expect(toE164("AE", "")).toBe("");
  });

  it("checks a whole number per country", () => {
    expect(isValidMobile("+971501234567")).toBe(true);
    expect(isValidMobile("+974501234120")).toBe(false);
    expect(isValidMobile("")).toBe(false);
  });

  it("formats a stored number for reading, and keeps one that does not parse", () => {
    expect(formatPhoneNumber("+971501234567")).toBe("+971 50 123 4567");
    expect(formatPhoneNumber("not a phone")).toBe("not a phone");
  });

  it("gives the example for the country the number was typed for, not the market's", () => {
    expect(exampleForNumber("+974501234120", "AE")).toBe(exampleNationalNumber("QA"));
    expect(exampleForNumber("+96612", "AE")).toBe(exampleNationalNumber("SA"));
    // A dial code shared by several countries uses its main one.
    expect(exampleForNumber("+1555", "AE")).toBe(exampleNationalNumber("US"));
    // Nothing typed yet: the market's country.
    expect(exampleForNumber("", "KW")).toBe(exampleNationalNumber("KW"));
    expect(exampleForNumber("", null)).toBe(exampleNationalNumber("AE"));
  });
});
