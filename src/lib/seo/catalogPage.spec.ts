import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

import { buildCatalogMetadata, listingMetaDescription, metaDescriptionText } from "./catalogPage";

const brand = { name: "Swiss Arabian UAE", names: ["Swiss Arabian UAE"] };

describe("metaDescriptionText", () => {
  it("turns Shopify HTML into plain text", () => {
    expect(metaDescriptionText("<p>Rich <strong>oud</strong>&nbsp;&amp; rose.</p>")).toBe("Rich oud & rose.");
  });

  it("cuts long text at a word, under 160 characters", () => {
    const long = "word ".repeat(60);
    const out = metaDescriptionText(long)!;
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });

  it("is undefined for empty or tag-only input", () => {
    expect(metaDescriptionText("  ")).toBeUndefined();
    expect(metaDescriptionText("<p> </p>")).toBeUndefined();
    expect(metaDescriptionText(undefined)).toBeUndefined();
  });
});

describe("listing descriptions", () => {
  it("gives a listing without a description a default naming it and the brand", () => {
    const meta = buildCatalogMetadata(
      { locale: "en", path: "/collections/flash-sale", title: "Flash Sale", listing: true },
      { brand },
    );
    expect(meta.description).toBe(listingMetaDescription("en", "Flash Sale", "Swiss Arabian UAE"));
    expect(meta.openGraph?.description).toBe(meta.description);
  });

  it("keeps the listing's own description", () => {
    const meta = buildCatalogMetadata(
      { locale: "en", path: "/collections/oud", title: "Oud", description: "<p>Our oud.</p>", listing: true },
      { brand },
    );
    expect(meta.description).toBe("Our oud.");
  });

  it("does not invent a description for other pages", () => {
    const meta = buildCatalogMetadata({ locale: "en", path: "/faq", title: "FAQ" }, { brand });
    expect(meta.description).toBeUndefined();
  });

  it("writes the default in Arabic on Arabic pages", () => {
    expect(listingMetaDescription("ar", "عطور", "سويس أرابيان")).toContain("سويس أرابيان");
  });
});
