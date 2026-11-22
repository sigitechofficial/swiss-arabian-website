import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("falls back to the old build settings when none can be used", () => {
    expect(localeConfigFromMarket([])).toEqual(fallbackLocaleConfig());
    expect(localeConfigFromMarket(["de"])).toEqual(fallbackLocaleConfig());
    for (const code of fallbackLocaleConfig().locales) {
      expect(MESSAGE_LOCALES).toContain(code);
    }
  });

  describe("outage fallback (no build setting for languages)", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("every language the website can show, English first; the retired build settings are ignored", async () => {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_SHOP_LOCALES", "fr,en");
      vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "fr");
      const mod = await import("./locales");
      expect(mod.fallbackLocaleConfig()).toEqual({
        locales: ["en", ...mod.MESSAGE_LOCALES.filter((code) => code !== "en")],
        defaultLocale: "en",
      });
      expect(mod.DEFAULT_LOCALE).toBe("en");
    });
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
