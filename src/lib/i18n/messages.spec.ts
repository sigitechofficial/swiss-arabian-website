import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import {
  createTranslator,
  englishTranslator,
  formatMessage,
  getTranslator,
  loadMessages,
} from "./messages";

describe("message files", () => {
  it("translate every English key into Arabic (or fall back on purpose)", () => {
    const missing = Object.keys(en).filter((key) => !(key in ar));
    // Keys whose Arabic wording is English on purpose (same as before the move).
    expect(missing.sort()).toEqual(["pages.faq.description", "promo.toGo"]);
    // No Arabic key that English does not define.
    expect(Object.keys(ar).filter((key) => !(key in en))).toEqual([]);
  });

  it("use the same placeholders in every language", () => {
    const names = (value: unknown) =>
      [...JSON.stringify(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [key, value] of Object.entries(ar)) {
      const english = names((en as Record<string, unknown>)[key]);
      for (const name of names(value)) {
        if (key === "promo.viewAllBenefits" && name === "label") continue;
        expect(english, `${key} {${name}}`).toContain(name);
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

  it("falls back to English, then to the key", () => {
    const t = createTranslator("fr", { home: "Accueil" });
    expect(t("home")).toBe("Accueil");
    expect(t("tryAgain")).toBe("Try again");
    expect(formatMessage("fr", {}, "no.such.key")).toBe("no.such.key");
  });
});
