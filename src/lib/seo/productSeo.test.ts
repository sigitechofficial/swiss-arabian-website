import { describe, expect, it } from "vitest";
import { effectiveProductSeo, parseSchemaOverride } from "./productSeo";

describe("effectiveProductSeo", () => {
  it("uses the market override over the brand value, ignoring empty overrides", () => {
    const seo = effectiveProductSeo(
      {
        title: "Brand title",
        robots: "index, follow",
        ogImage: "https://cdn/x.jpg",
        schemaEnabled: true,
        marketOverrides: {
          qtr: { title: "Qatar title", ogImage: "  ", schemaEnabled: false },
        },
      },
      "qtr",
    );
    expect(seo).toEqual({
      title: "Qatar title",
      robots: "index, follow",
      ogImage: "https://cdn/x.jpg",
      schemaEnabled: false,
    });
  });

  it("returns null without a package", () => {
    expect(effectiveProductSeo(null, "qtr")).toBeNull();
  });
});

describe("parseSchemaOverride", () => {
  it("parses objects and rejects bad JSON", () => {
    expect(parseSchemaOverride('{"@type":"Product"}')).toEqual({
      "@type": "Product",
    });
    expect(parseSchemaOverride("{oops")).toBeNull();
    expect(parseSchemaOverride("[1]")).toBeNull();
    expect(parseSchemaOverride(undefined)).toBeNull();
  });
});
