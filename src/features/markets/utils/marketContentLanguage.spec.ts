import { describe, expect, it } from "vitest";
import { marketContentLanguage } from "./marketContentLanguage";
import type { StorefrontMarketLanguage } from "../types/market";

const language = (locale: string, isDefault = false): StorefrontMarketLanguage => ({
  locale,
  languageCode: locale,
  displayName: locale,
  isDefault,
});

describe("market content language", () => {
  const uae = [language("en-us", true), language("ar")];

  it("asks for English content with the code the market registered", () => {
    expect(marketContentLanguage(uae, "en")).toBe("en-us");
  });

  it("keeps a code the market registered as is", () => {
    expect(marketContentLanguage(uae, "ar")).toBe("ar");
    expect(marketContentLanguage([language("en", true), language("en-gb")], "en")).toBe("en");
  });

  it("prefers the market default among regional codes of the same language", () => {
    expect(marketContentLanguage([language("en-gb"), language("en-us", true)], "en")).toBe("en-us");
  });

  it("returns null when the market does not offer the language", () => {
    expect(marketContentLanguage([language("en-us", true)], "ar")).toBeNull();
    expect(marketContentLanguage(undefined, "en")).toBeNull();
  });
});
