import { describe, expect, it } from "vitest";
import { collectionSeoTextView } from "./collectionSeoTextView";
import { pageRendersOwnSeoText } from "./seoTextOwner";

describe("collectionSeoTextView", () => {
  it("turns plain paragraphs into escaped HTML paragraphs", () => {
    expect(
      collectionSeoTextView(
        {
          heading: " Perfumes for women ",
          body: "Floral & oud <3\nline two\n\nSecond paragraph.",
          locale: "en",
        },
        "en",
      ),
    ).toEqual({
      heading: "Perfumes for women",
      bodyHtml:
        "<p>Floral &amp; oud &lt;3<br>line two</p><p>Second paragraph.</p>",
      lang: "en",
      dir: "ltr",
    });
  });

  it("uses the text's language for lang/dir (Arabic is rtl)", () => {
    const view = collectionSeoTextView(
      { heading: "عطور نسائية", body: null, locale: "ar" },
      "en",
    );
    expect(view).toMatchObject({ lang: "ar", dir: "rtl", bodyHtml: "" });
    expect(
      collectionSeoTextView({ heading: null, body: "Text" }, "ar-QA"),
    ).toMatchObject({ lang: "ar", dir: "rtl" });
  });

  it("is null without text", () => {
    expect(collectionSeoTextView(null, "en")).toBeNull();
    expect(
      collectionSeoTextView({ heading: " ", body: "\n\n" }, "en"),
    ).toBeNull();
  });
});

describe("pageRendersOwnSeoText", () => {
  it("is the collection page in both languages only", () => {
    expect(pageRendersOwnSeoText("/collections/women")).toBe(true);
    expect(pageRendersOwnSeoText("/ar/collections/women/")).toBe(true);
    expect(pageRendersOwnSeoText("/collections")).toBe(false);
    expect(pageRendersOwnSeoText("/")).toBe(false);
    expect(pageRendersOwnSeoText("/ar")).toBe(false);
    expect(pageRendersOwnSeoText("/products/ward")).toBe(false);
    expect(pageRendersOwnSeoText("/categories/women")).toBe(false);
  });
});
