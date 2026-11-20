import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkMessages, checkWebsite } from "../../../scripts/i18n-check.mjs";

/** `npm run i18n:check`: every message file against English (keys, slots, plurals). */
describe("i18n:check", () => {
  it("passes for the message files, brand storefront files and approvals in the repository", () => {
    const result = checkWebsite(path.resolve(__dirname, "../../.."));
    expect(result.messages.map((file) => file.locale)).toEqual(expect.arrayContaining(["ar", "fr"]));
    for (const file of result.messages) expect({ locale: file.locale, errors: file.errors }).toEqual({ locale: file.locale, errors: [] });
    expect(result.brands.length).toBeGreaterThan(0);
    for (const { brand, results } of result.brands) {
      expect(results.length).toBeGreaterThan(0);
      for (const file of results) {
        expect({ brand, file: `${file.locale}/${file.name}`, errors: file.errors }).toEqual({ brand, file: `${file.locale}/${file.name}`, errors: [] });
      }
    }
    expect(result.approvals).toEqual([]);
  });

  it("finds unknown keys, changed slots, wrong shapes, unknown plural forms and missing plural forms", () => {
    const english = {
      home: "Home",
      greet: "Hi {name}",
      count: { one: "{count} item", other: "{count} items" },
      "promo.viewAllBenefits": "View all {count} benefits",
    };
    const result = checkMessages(
      english,
      {
        $comment: "DRAFT",
        greet: "Salut {nom}",
        count: "articles",
        extra: "x",
        "promo.viewAllBenefits": "{label} ({count})",
      },
      "fr",
    );
    expect(result.errors).toEqual([
      "greet: placeholders {nom} differ from English {name}",
      "count: needs plural forms like English",
      "extra: not an English key",
    ]);
    expect(result.missing).toEqual(["home"]);
    const plural = checkMessages(english, { count: { one: "{count} article", other: "{count} articles" } }, "fr");
    expect(plural.errors).toEqual([]);
    expect(plural.warnings).toEqual(['count: plural forms missing for fr: many (they read "other")']);
    const bogus = checkMessages(english, { count: { one: "{count} article", other: "{count} articles", bogus: "x" } }, "fr");
    expect(bogus.errors).toEqual(["count: unknown plural form bogus (plural forms are zero, one, two, few, many, other)"]);
    const noOther = checkMessages(english, { count: { one: "{count} article" } }, "fr");
    expect(noOther.errors).toEqual(['count: plural forms need "other"']);
  });

  it('reads only own keys (a key named "constructor" is not an English key)', () => {
    expect(checkMessages({ home: "Home" }, JSON.parse('{"constructor":"x","toString":"y"}'), "fr").errors).toEqual([
      "constructor: not an English key",
      "toString: not an English key",
    ]);
  });

  describe("brand storefront files and approvals", () => {
    let root: string;
    const write = (file: string, data: unknown) => {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      writeFileSync(path.join(root, file), JSON.stringify(data));
    };
    beforeEach(() => {
      root = mkdtempSync(path.join(tmpdir(), "i18n-check-"));
      write("src/messages/en.json", { home: "Home" });
      write("src/brands/demo/i18n/messages/en/shell.json", { menu: "Menu" });
    });
    afterEach(() => rmSync(root, { recursive: true, force: true }));

    it("checks each brand's area files against English and refuses an area English does not have", () => {
      write("src/brands/demo/i18n/messages/ar/shell.json", { menu: "القائمة", extra: "x" });
      write("src/brands/demo/i18n/messages/ar/unknown.json", {});
      const [{ brand, results }] = checkWebsite(root).brands;
      expect(brand).toBe("demo");
      expect(results.map((file: { name: string; errors: string[] }) => [file.name, file.errors])).toEqual([
        ["shell.json", ["extra: not an English key"]],
        ["unknown.json", ["unknown.json: no such area in English"]],
      ]);
    });

    it("refuses an approval for a text that does not exist", () => {
      write("src/lib/i18n/translation-approvals.json", {
        approvals: [{ by: "Example Pay", keys: ["site:home", "site:demo:shell:menu", "site:gone", "site:demo:shell:gone"] }],
      });
      expect(checkWebsite(root).approvals).toEqual([
        "site:gone (approval by Example Pay): no such text",
        "site:demo:shell:gone (approval by Example Pay): no such text",
      ]);
    });
  });
});
