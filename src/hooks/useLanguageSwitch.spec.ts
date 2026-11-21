import { describe, expect, it } from "vitest";
import type { LocaleConfig } from "@/lib/i18n/locales";
import { languageSwitchPath } from "./useLanguageSwitch";

const EN_AR: LocaleConfig = { locales: ["en", "ar"], defaultLocale: "en" };

describe("languageSwitchPath", () => {
  it("ignores languages the market does not serve and the current one", () => {
    expect(languageSwitchPath("/blog", "xx", EN_AR)).toBeNull();
    expect(languageSwitchPath("/blog", "fr", EN_AR)).toBeNull();
    expect(languageSwitchPath("/blog", "en", EN_AR)).toBeNull();
  });

  it("prefixes the same page with the other language", () => {
    expect(languageSwitchPath("/blog", "ar", EN_AR)).toBe("/ar/blog");
    expect(languageSwitchPath("/ar/blog", "en", EN_AR)).toBe("/blog");
  });

  it("follows a market whose default is Arabic", () => {
    const arabicFirst: LocaleConfig = { locales: ["ar", "en"], defaultLocale: "ar" };
    expect(languageSwitchPath("/blog", "en", arabicFirst)).toBe("/en/blog");
    expect(languageSwitchPath("/en/blog", "ar", arabicFirst)).toBe("/blog");
  });
});
