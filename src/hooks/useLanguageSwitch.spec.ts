import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";
import { languageSwitchPath } from "./useLanguageSwitch";

describe("languageSwitchPath", () => {
  const other = LOCALES.find((code) => code !== DEFAULT_LOCALE);

  it("ignores unknown languages and the current one", () => {
    expect(languageSwitchPath("/blog", "xx")).toBeNull();
    expect(languageSwitchPath("/blog", DEFAULT_LOCALE)).toBeNull();
  });

  it.runIf(Boolean(other))("prefixes the same page with the other language", () => {
    expect(languageSwitchPath("/blog", other!)).toBe(`/${other}/blog`);
    expect(languageSwitchPath(`/${other}/blog`, DEFAULT_LOCALE)).toBe("/blog");
  });
});
