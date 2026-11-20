import { describe, expect, it } from "vitest";
import { nameInLanguage } from "./nameByLanguage";

describe("nameInLanguage", () => {
  const names = { en: "Express delivery", ar: "توصيل سريع" };

  it("reads the exact language, then the base language", () => {
    expect(nameInLanguage({ ...names, "ar-ae": "توصيل الإمارات" }, "ar-AE")).toBe("توصيل الإمارات");
    expect(nameInLanguage(names, "ar-SA")).toBe("توصيل سريع");
  });

  it("then English, then the name the answer carried", () => {
    expect(nameInLanguage(names, "fr", "Livraison")).toBe("Express delivery");
    expect(nameInLanguage(null, "ar", "Express")).toBe("Express");
    expect(nameInLanguage({ ar: " " }, "ar", null)).toBe("");
  });
});
