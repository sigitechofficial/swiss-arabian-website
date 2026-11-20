import { describe, expect, it } from "vitest";
import path from "node:path";
import { checkMessageFolder, checkMessages } from "../../../scripts/i18n-check.mjs";

/** `npm run i18n:check`: every message file against English (keys, slots, plurals). */
describe("i18n:check", () => {
  it("passes for the message files in the repository", () => {
    const results = checkMessageFolder(path.resolve(__dirname, "../../messages"));
    expect(results.map((result) => result.locale)).toEqual(expect.arrayContaining(["ar", "fr"]));
    for (const result of results) expect({ locale: result.locale, errors: result.errors }).toEqual({ locale: result.locale, errors: [] });
  });

  it("finds unknown keys, changed slots, wrong shapes and missing plural forms", () => {
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
  });
});
