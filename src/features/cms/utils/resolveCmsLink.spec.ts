import { describe, expect, it } from "vitest";
import { isExternalHref, resolveCmsLink } from "./resolveCmsLink";

describe("resolveCmsLink", () => {
  it("returns null for NONE / missing", () => {
    expect(resolveCmsLink(null)).toBeNull();
    expect(resolveCmsLink({ type: "NONE" })).toBeNull();
  });

  it("resolves INTERNAL_PATH safely", () => {
    expect(resolveCmsLink({ type: "INTERNAL_PATH", url: "/products" })).toBe(
      "/products",
    );
    expect(resolveCmsLink({ type: "INTERNAL_PATH", url: "//evil.com" })).toBeNull();
    expect(
      resolveCmsLink({ type: "INTERNAL_PATH", url: "javascript:alert(1)" }),
    ).toBeNull();
  });

  it("resolves EXTERNAL_URL http(s) only", () => {
    expect(
      resolveCmsLink({ type: "EXTERNAL_URL", url: "https://example.com/x" }),
    ).toBe("https://example.com/x");
    expect(
      resolveCmsLink({ type: "EXTERNAL_URL", url: "javascript:alert(1)" }),
    ).toBeNull();
  });

  it("resolves PRODUCT/COLLECTION/CATEGORY via slug maps", () => {
    const ctx = {
      productSlugs: { p1: "oud-intense" },
      collectionSlugs: { c1: "trending" },
      categorySlugs: { cat1: "men" },
    };
    expect(resolveCmsLink({ type: "PRODUCT", referenceId: "p1" }, ctx)).toBe(
      "/products/oud-intense",
    );
    expect(resolveCmsLink({ type: "COLLECTION", referenceId: "c1" }, ctx)).toBe(
      "/collections/trending",
    );
    expect(resolveCmsLink({ type: "CATEGORY", referenceId: "cat1" }, ctx)).toBe(
      "/categories/men",
    );
  });

  it("falls back safely when slug missing", () => {
    expect(resolveCmsLink({ type: "PRODUCT", referenceId: "missing" })).toBe(
      "/products",
    );
  });
});

describe("isExternalHref", () => {
  it("detects absolute http(s)", () => {
    expect(isExternalHref("https://a.com")).toBe(true);
    expect(isExternalHref("/products")).toBe(false);
  });
});
