import { describe, expect, it } from "vitest";
import {
  baseLanguage,
  DEFAULT_LOCALE,
  dir,
  intlLocale,
  isLocale,
  isRtl,
  localeDisplayName,
  localeMeta,
  LOCALES,
  matchLocale,
  parseLocaleList,
  resolveLocaleConfig,
  toLocale,
} from "./locales";

describe("locale configuration", () => {
  it("defaults to English (no prefix) and Arabic", () => {
    expect(LOCALES).toEqual(["en", "ar"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("reads a configured list, default first, ignoring junk and duplicates", () => {
    expect(parseLocaleList(" EN, ar ,fr_FR, ../x, ar,")).toEqual(["en", "ar", "fr-fr"]);
    expect(resolveLocaleConfig("en,ar,fr", "fr")).toEqual({
      locales: ["fr", "en", "ar"],
      defaultLocale: "fr",
    });
    // A default that is not in the list falls back to the first entry.
    expect(resolveLocaleConfig("ar,en", "de")).toEqual({ locales: ["ar", "en"], defaultLocale: "ar" });
    expect(resolveLocaleConfig("", "")).toEqual({ locales: ["en", "ar"], defaultLocale: "en" });
  });

  it("validates codes against the configured list", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(toLocale("AR")).toBe("ar");
    expect(toLocale("de")).toBe("en");
  });

  it("matches API language codes by base language", () => {
    expect(matchLocale("ar-SA")).toBe("ar");
    expect(matchLocale("EN_us")).toBe("en");
    expect(matchLocale("fr")).toBeNull();
    expect(matchLocale("")).toBeNull();
    expect(baseLanguage("ar-AE")).toBe("ar");
  });
});

describe("locale metadata", () => {
  it("writes Arabic, Persian, Urdu and Hebrew right to left", () => {
    for (const code of ["ar", "fa", "ur", "he", "ar-SA"]) {
      expect(isRtl(code)).toBe(true);
      expect(dir(code)).toBe("rtl");
    }
    for (const code of ["en", "fr", "de", "", null]) {
      expect(isRtl(code)).toBe(false);
      expect(dir(code)).toBe("ltr");
    }
  });

  it("gives Intl tags in the house style", () => {
    expect(intlLocale("en")).toBe("en-GB");
    expect(intlLocale("ar")).toBe("ar");
    expect(intlLocale("fr")).toBe("fr");
  });

  it("names each language in itself", () => {
    expect(localeDisplayName("en")).toBe("English");
    expect(localeDisplayName("ar")).toBe("العربية");
    expect(localeMeta("ar")).toEqual({ code: "ar", dir: "rtl", intl: "ar", name: "العربية" });
  });
});
