import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currencyDigits,
  formatMoney,
  formatMoneyParts,
  fromMinorUnits,
  isDecimalAmount,
  parseMoney,
  roundMoney,
  toDecimalString,
  toMinorUnits,
} from "./money";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("currencyDigits", () => {
  it("reads ISO 4217 minor units from the platform", () => {
    for (const code of ["KWD", "BHD", "OMR"]) expect(currencyDigits(code)).toBe(3);
    for (const code of ["AED", "USD", "QAR", "SAR"]) expect(currencyDigits(code)).toBe(2);
    expect(currencyDigits("JPY")).toBe(0);
  });

  it("accepts any case and spacing", () => {
    expect(currencyDigits(" kwd ")).toBe(3);
  });

  it("falls back to two decimals for a missing or malformed code", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(currencyDigits(null)).toBe(2);
    expect(currencyDigits("")).toBe(2);
    expect(currencyDigits("K1")).toBe(2);
  });
});

describe("parseMoney", () => {
  it("reads API strings and numbers", () => {
    expect(parseMoney("10.120")).toBe(10.12);
    expect(parseMoney(" 63.00 ")).toBe(63);
    expect(parseMoney(19.75)).toBe(19.75);
  });

  it("is null for anything that is not an amount", () => {
    for (const value of [null, undefined, "", "   ", "abc", Number.NaN, Number.POSITIVE_INFINITY, {}]) {
      expect(parseMoney(value)).toBeNull();
    }
  });
});

describe("isDecimalAmount", () => {
  it("accepts plain amounts with at most the currency's decimals", () => {
    expect(isDecimalAmount("10.120", "KWD")).toBe(true);
    expect(isDecimalAmount("10.12", "KWD")).toBe(true);
    expect(isDecimalAmount("65.00", "AED")).toBe(true);
    expect(isDecimalAmount("1500", "JPY")).toBe(true);
  });

  it("rejects extra decimals and anything that is not a plain amount", () => {
    for (const [text, code] of [["65.001", "AED"], ["1500.5", "JPY"], ["1,500", "AED"], ["AED 65", "AED"], ["-1", "AED"], ["", "AED"], [null, "AED"]] as const) {
      expect(isDecimalAmount(text, code)).toBe(false);
    }
  });
});

describe("formatMoney", () => {
  it("shows three decimals for KWD, BHD and OMR", () => {
    expect(formatMoney(10.12, "KWD")).toBe("KWD 10.120");
    expect(formatMoney("10.120", "KWD")).toBe("KWD 10.120");
    expect(formatMoney("4.5", "BHD")).toBe("BHD 4.500");
    expect(formatMoney(0.25, "OMR")).toBe("OMR 0.250");
  });

  it("shows two decimals for AED and USD and none for JPY", () => {
    expect(formatMoney(250, "AED")).toBe("AED 250.00");
    expect(formatMoney("19.5", "USD")).toBe("USD 19.50");
    expect(formatMoney(1500, "JPY")).toBe("JPY 1500");
  });

  it("rounds to the currency's own minor units", () => {
    expect(formatMoney(10.1204, "KWD")).toBe("KWD 10.120");
    expect(formatMoney(10.1205, "KWD")).toBe("KWD 10.121");
    expect(formatMoney(1.005, "AED")).toBe("AED 1.01");
    expect(formatMoney(1499.6, "JPY")).toBe("JPY 1500");
  });

  it("drops the decimals only on whole amounts when asked", () => {
    const trim = { trimWholeAmounts: true } as const;
    expect(formatMoney(63, "AED", trim)).toBe("AED 63");
    expect(formatMoney(19.75, "AED", trim)).toBe("AED 19.75");
    expect(formatMoney("10.000", "KWD", trim)).toBe("KWD 10");
    expect(formatMoney("10.120", "KWD", trim)).toBe("KWD 10.120");
    expect(formatMoney(10.0004, "KWD", trim)).toBe("KWD 10");
  });

  it("keeps the code-first house style on every page language", () => {
    expect(formatMoney("10.120", "KWD", { locale: "ar" })).toBe("KWD 10.120");
    expect(formatMoney("10.120", "KWD", { locale: "fr" })).toBe("KWD 10.120");
  });

  it("uses the page language's own currency format when localized", () => {
    const ar = formatMoney("10.120", "KWD", { display: "localized", locale: "ar" });
    expect(ar).toMatch(/10[.٫]120|١٠٫١٢٠/);
    expect(ar).not.toMatch(/[A-Za-z]/);
    expect(formatMoney("10.120", "KWD", { display: "localized", locale: "en" })).toMatch(/^KWD\s10\.120$/);
    expect(formatMoney(10, "KWD", { display: "localized", locale: "en", trimWholeAmounts: true })).toMatch(
      /^KWD\s10$/,
    );
  });

  it("formats the same as the server for a given locale (no device locale)", () => {
    const a = formatMoney(1234.5, "AED", { display: "localized", locale: "ar" });
    const b = formatMoney(1234.5, "AED", { display: "localized", locale: "ar" });
    expect(a).toBe(b);
  });

  it("does not throw for a malformed currency code and logs it once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(formatMoney(10.5, "K!W")).toBe("K!W 10.50");
    expect(formatMoney(10.5, "K!W", { display: "localized", locale: "ar" })).toBe("K!W 10.50");
    expect(warn.mock.calls.filter(([message]) => String(message).includes("K!W"))).toHaveLength(1);
  });

  it("shows only the number without a currency code", () => {
    expect(formatMoney(10.5, null)).toBe("10.50");
  });

  it("is empty for a missing amount", () => {
    expect(formatMoney("", "AED")).toBe("");
    expect(formatMoney(Number.NaN, "AED")).toBe("");
  });
});

describe("formatMoneyParts", () => {
  it("splits the code and the number", () => {
    expect(formatMoneyParts("10.120", "KWD")).toEqual({ currency: "KWD", amount: "10.120" });
    expect(formatMoneyParts(79, "AED", { trimWholeAmounts: true })).toEqual({ currency: "AED", amount: "79" });
  });

  it("uses the language's currency sign when localized", () => {
    const parts = formatMoneyParts("10.120", "KWD", { display: "localized", locale: "ar" });
    expect(parts?.currency).toBe("د.ك.");
    expect(parts?.amount).toMatch(/10[.٫]120|١٠٫١٢٠/);
  });
});

describe("machine amounts", () => {
  it("writes decimal strings with the currency's minor units", () => {
    expect(toDecimalString(10.12, "KWD")).toBe("10.120");
    expect(toDecimalString("250", "AED")).toBe("250.00");
    expect(toDecimalString(1500.4, "JPY")).toBe("1500");
    expect(toDecimalString("", "AED")).toBe("");
  });

  it("converts to and from integer minor units", () => {
    expect(toMinorUnits("10.120", "KWD")).toBe(10120);
    expect(toMinorUnits(10.5, "AED")).toBe(1050);
    expect(toMinorUnits(1.005, "AED")).toBe(101);
    expect(toMinorUnits(1500, "JPY")).toBe(1500);
    expect(fromMinorUnits(10120, "KWD")).toBe(10.12);
    expect(fromMinorUnits(1050, "AED")).toBe(10.5);
    expect(fromMinorUnits(1500, "JPY")).toBe(1500);
  });

  it("rounds half away from zero at the currency's digits", () => {
    expect(roundMoney(10.1205, "KWD")).toBe(10.121);
    expect(roundMoney(-10.1205, "KWD")).toBe(-10.121);
    expect(roundMoney(19.755, "AED")).toBe(19.76);
    expect(roundMoney(-0.001, "AED")).toBe(0);
    expect(roundMoney(1e-7, "KWD")).toBe(0);
  });
});
