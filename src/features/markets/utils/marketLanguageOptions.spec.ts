import { describe, expect, it } from "vitest";
import type { LocaleConfig } from "@/lib/i18n/locales";
import {
  configuredLanguageOptions,
  marketLanguageOptions,
} from "./marketLanguageOptions";

const language = (locale: string, isDefault = false, displayName: string | null = null) => ({
  locale,
  languageCode: locale.split("-")[0]!,
  displayName,
  isDefault,
});

const EN_AR: LocaleConfig = { locales: ["en", "ar"], defaultLocale: "en" };

describe("language picker", () => {
  it("falls back to the page market's languages, named in themselves", () => {
    expect(configuredLanguageOptions(EN_AR)).toEqual([
      { id: "en", label: "English", lang: "en" },
      { id: "ar", label: "العربية", lang: "ar" },
    ]);
    expect(marketLanguageOptions(null, null, EN_AR)).toEqual(configuredLanguageOptions(EN_AR));
    expect(marketLanguageOptions([language("de-de")], null, EN_AR)).toEqual(
      configuredLanguageOptions(EN_AR),
    );
  });

  it("lists the market's languages the website can show, its default first", () => {
    expect(
      marketLanguageOptions(
        [language("en-us"), language("ar-sa", true), language("fr-fr"), language("de-de")],
        null,
        EN_AR,
      ).map((option) => option.id),
    ).toEqual(["ar", "en", "fr"]);
  });

  it("an English-only market still lists the page's own language", () => {
    expect(marketLanguageOptions([language("en-us", true)], "en", EN_AR).map((o) => o.id)).toEqual(["en"]);
    expect(marketLanguageOptions([language("en-us", true)], "ar", EN_AR).map((o) => o.id)).toEqual([
      "en",
      "ar",
    ]);
  });
});
