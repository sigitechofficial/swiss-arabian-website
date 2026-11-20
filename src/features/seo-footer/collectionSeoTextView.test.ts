import { describe, expect, it } from "vitest";
import { collectionSeoTextView } from "./collectionSeoTextView";
import { showsMarketSeoText } from "./seoTextOwner";

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

/** SEO audit p6: the home page's SEO text is not repeated on other pages. */
describe("showsMarketSeoText", () => {
  it("is the home page in every language only", () => {
    expect(showsMarketSeoText("/")).toBe(true);
    expect(showsMarketSeoText("/ar")).toBe(true);
    expect(showsMarketSeoText("/ar/")).toBe(true);
    expect(showsMarketSeoText("/collections/women")).toBe(false);
    expect(showsMarketSeoText("/collections")).toBe(false);
    expect(showsMarketSeoText("/products/ward")).toBe(false);
    expect(showsMarketSeoText("/categories/women")).toBe(false);
    expect(showsMarketSeoText("/store-locator")).toBe(false);
    expect(showsMarketSeoText("/pages/contact-us")).toBe(false);
  });
});
