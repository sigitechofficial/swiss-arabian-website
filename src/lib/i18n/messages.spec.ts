import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  createTranslator,
  englishTranslator,
  formatMessage,
  getTranslator,
  loadMessages,
  messageFilesFor,
} from "./messages";

/** Every language file next to English (`src/messages/<locale>.json`). */
const MESSAGE_DIR = path.resolve(__dirname, "../../messages");
const LANGUAGE_FILES = readdirSync(MESSAGE_DIR)
  .filter((name) => name.endsWith(".json") && name !== "en.json")
  .map((name) => ({
    locale: name.replace(/\.json$/, ""),
    messages: JSON.parse(readFileSync(path.join(MESSAGE_DIR, name), "utf8")) as Record<string, unknown>,
  }));

/**
 * English keys a language may leave out on purpose (it then reads English),
 * by locale, each with its reason.
 */
const ENGLISH_ON_PURPOSE: Record<string, string[]> = {
  ar: [
    // The FAQ page description stays English as before the move to message files.
    "pages.faq.description",
    // "{amount} to go" is shown inside a progress bar whose Arabic wording is still to be approved.
    "promo.toGo",
  ],
};

const slotNames = (value: unknown) =>
  [...new Set([...JSON.stringify(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

describe("message files", () => {
  it("finds the language files", () => {
    expect(LANGUAGE_FILES.map((file) => file.locale)).toContain("ar");
  });

  it.each(LANGUAGE_FILES)("$locale.json has every English key (or leaves it out on purpose)", ({ locale, messages }) => {
    const missing = Object.keys(en).filter((key) => !(key in messages));
    expect(missing.sort()).toEqual([...(ENGLISH_ON_PURPOSE[locale] ?? [])].sort());
    // No key that English does not define.
    expect(Object.keys(messages).filter((key) => !(key in en))).toEqual([]);
  });

  it.each(LANGUAGE_FILES)("$locale.json uses the same {slots} as English", ({ locale, messages }) => {
    const english = en as Record<string, unknown>;
    for (const [key, value] of Object.entries(messages)) {
      if (!(key in english)) continue;
      const own = slotNames(value);
      const reference = slotNames(english[key]);
      // A plural form may say the number in words ("منتج واحد"): {count} is optional there.
      const plural = typeof value === "object" && value !== null;
      const comparable = (names: string[]) => (plural ? names.filter((name) => name !== "count") : names);
      // promo.viewAllBenefits: the Arabic wording names the link itself ({label}).
      if (key === "promo.viewAllBenefits" && locale === "ar") continue;
      expect(comparable(own), `${locale}: ${key}`).toEqual(comparable(reference));
    }
  });

  it.each(LANGUAGE_FILES)("$locale.json plural entries have an `other` form", ({ locale, messages }) => {
    for (const [key, value] of Object.entries(messages)) {
      if (typeof value === "object" && value !== null) {
        expect((value as Record<string, unknown>).other, `${locale}: ${key}`).toEqual(expect.any(String));
      }
    }
  });
});

describe("loading and formatting", () => {
  it("loads a locale's file over English", async () => {
    const messages = await loadMessages("ar");
    expect(messages.home).toBe("الرئيسية");
    // Missing in ar.json: English wording.
    expect(messages["promo.toGo"]).toBe("{amount} to go");
  });

  it("unknown locales read the default language", async () => {
    const t = await getTranslator("xx");
    expect(t("home")).toBe("Home");
  });

  it("fills placeholders", async () => {
    const t = await getTranslator("ar");
    expect(t("listing.pageTitle", { title: "العود", page: 2 })).toBe("العود – صفحة 2");
    expect(englishTranslator("listing.metaDescription", { title: "Oud", brand: "Swiss Arabian" })).toBe(
      "Shop Oud at Swiss Arabian: browse the full range of fragrances online.",
    );
    // A value that is not given stays visible rather than vanishing.
    expect(englishTranslator("listing.pageTitle", { title: "Oud" })).toBe("Oud – Page {page}");
  });

  it("chooses plural forms by the language's rules", async () => {
    expect(englishTranslator("catalog.productCount", { count: 1 })).toBe("1 product");
    expect(englishTranslator("catalog.productCount", { count: 0 })).toBe("0 products");
    expect(englishTranslator("catalog.productCount", { count: 5 })).toBe("5 products");
    const t = await getTranslator("ar");
    expect(t("catalog.productCount", { count: 0 })).toBe("لا توجد منتجات");
    expect(t("catalog.productCount", { count: 1 })).toBe("منتج واحد");
    expect(t("catalog.productCount", { count: 2 })).toBe("منتجان");
    expect(t("catalog.productCount", { count: 3 })).toBe("3 منتجات");
    expect(t("catalog.productCount", { count: 11 })).toBe("11 منتجًا");
    expect(t("catalog.productCount", { count: 100 })).toBe("100 منتج");
  });

  it("writes a plural's count in the page's number format with Latin digits", async () => {
    expect(englishTranslator("catalog.productCount", { count: 1234 })).toBe("1,234 products");
    const t = await getTranslator("ar");
    expect(t("catalog.productCount", { count: 3 })).toBe("3 منتجات");
    expect(t("catalog.productCount", { count: 1234 })).not.toMatch(/[٠-٩]/);
  });

  it("reads a regional language over its base language", () => {
    expect(messageFilesFor("fr-ca")).toEqual(["fr", "fr-ca"]);
    expect(messageFilesFor("pt-br")).toEqual(["pt", "pt-br"]);
    expect(messageFilesFor("ar")).toEqual(["ar"]);
  });

  it("falls back to English, then to the key", () => {
    const t = createTranslator("fr", { home: "Accueil" });
    expect(t("home")).toBe("Accueil");
    expect(t("tryAgain")).toBe("Try again");
    expect(formatMessage("fr", {}, "no.such.key")).toBe("no.such.key");
  });
});
