import { describe, expect, it } from "vitest";
import { sitemapAlternates } from "./sitemapEntries";

const ORIGIN = "https://uae.swissarabian.com";

describe("sitemap entries", () => {
  it("lists each page once per language, each with every language's address and x-default", () => {
    const out = sitemapAlternates(
      [
        { path: "/", lastModified: "2026-11-01" },
        { path: "/products/oud" },
        { path: "/products/oud" },
      ],
      ORIGIN,
    );
    expect(out.map((entry) => entry.url)).toEqual([
      ORIGIN,
      `${ORIGIN}/ar`,
      `${ORIGIN}/products/oud`,
      `${ORIGIN}/ar/products/oud`,
    ]);
    expect(out[0]).toEqual({
      url: ORIGIN,
      lastModified: "2026-11-01",
      alternates: {
        languages: { en: ORIGIN, ar: `${ORIGIN}/ar`, "x-default": ORIGIN },
      },
    });
    expect(out[3]?.alternates?.languages).toEqual({
      en: `${ORIGIN}/products/oud`,
      ar: `${ORIGIN}/ar/products/oud`,
      "x-default": `${ORIGIN}/products/oud`,
    });
  });

  it("follows the configured languages (a third language needs no code)", () => {
    const out = sitemapAlternates([{ path: "/faq" }], ORIGIN, ["en", "ar", "fr"], "en");
    expect(out.map((entry) => entry.url)).toEqual([
      `${ORIGIN}/faq`,
      `${ORIGIN}/ar/faq`,
      `${ORIGIN}/fr/faq`,
    ]);
    expect(out[2]?.alternates?.languages).toEqual({
      en: `${ORIGIN}/faq`,
      ar: `${ORIGIN}/ar/faq`,
      fr: `${ORIGIN}/fr/faq`,
      "x-default": `${ORIGIN}/faq`,
    });
  });

  it("keeps relative addresses when the origin is unknown", () => {
    const out = sitemapAlternates([{ path: "/faq" }], "");
    expect(out).toEqual([
      { url: "/faq", alternates: undefined },
      { url: "/ar/faq", alternates: undefined },
    ]);
  });
});
