import { describe, expect, it } from "vitest";
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

describe("language picker", () => {
  it("falls back to every configured language, named in itself", () => {
    expect(configuredLanguageOptions()).toEqual([
      { id: "en", label: "English", lang: "en" },
      { id: "ar", label: "العربية", lang: "ar" },
    ]);
    expect(marketLanguageOptions(null)).toEqual(configuredLanguageOptions());
    expect(marketLanguageOptions([language("de-de")])).toEqual(configuredLanguageOptions());
  });

  it("lists the market's languages the shop supports, in the configured order", () => {
    expect(
      marketLanguageOptions([language("ar-sa", true), language("en-us"), language("fr-fr")]).map(
        (option) => option.id,
      ),
    ).toEqual(["en", "ar"]);
  });

  it("an English-only market still lists the page's own language", () => {
    expect(marketLanguageOptions([language("en-us", true)], "en").map((o) => o.id)).toEqual(["en"]);
    expect(marketLanguageOptions([language("en-us", true)], "ar").map((o) => o.id)).toEqual([
      "en",
      "ar",
    ]);
  });
});
