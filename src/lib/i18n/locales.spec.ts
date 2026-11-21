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
  MESSAGE_LOCALES,
  localeConfigFromMarket,
  fallbackLocaleConfig,
  servesLocale,
  matchServedLocale,
} from "./locales";
import { readdirSync } from "node:fs";
import { join } from "node:path";

describe("locale configuration", () => {
  it("knows every language it has a message file for; English is the fallback", () => {
    expect(LOCALES).toEqual(["en", "ar", "fr"]);
    expect(DEFAULT_LOCALE).toBe("en");
    const files = readdirSync(join(process.cwd(), "src", "messages"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
    expect([...MESSAGE_LOCALES].sort()).toEqual(files);
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
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(toLocale("AR")).toBe("ar");
    expect(toLocale("de")).toBe("en");
  });

  it("matches API language codes by base language", () => {
    expect(matchLocale("ar-SA")).toBe("ar");
    expect(matchLocale("EN_us")).toBe("en");
    expect(matchLocale("fr-CA")).toBe("fr");
    expect(matchLocale("de")).toBeNull();
    expect(matchLocale("")).toBeNull();
    expect(baseLanguage("ar-AE")).toBe("ar");
  });
});

describe("a market's languages (admin: Markets → languages)", () => {
  it("serves the market's languages the website can show, its default first and unprefixed", () => {
    expect(localeConfigFromMarket(["en-us", "ar"])).toEqual({ locales: ["en", "ar"], defaultLocale: "en" });
    expect(localeConfigFromMarket(["ar", "en-us", "fr-ca", "de"])).toEqual({
      locales: ["ar", "en", "fr"],
      defaultLocale: "ar",
    });
  });

  it("falls back to the old build settings, else English, when none can be used", () => {
    expect(localeConfigFromMarket([])).toEqual(fallbackLocaleConfig());
    expect(localeConfigFromMarket(["de"])).toEqual(fallbackLocaleConfig());
    expect(fallbackLocaleConfig().defaultLocale).toBe("en");
  });

  it("answers which languages a market serves", () => {
    const config = localeConfigFromMarket(["en", "ar"]);
    expect(servesLocale(config, "ar")).toBe(true);
    expect(servesLocale(config, "fr")).toBe(false);
    expect(matchServedLocale(config, "AR-sa")).toBe("ar");
    expect(matchServedLocale(config, "fr")).toBeNull();
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
