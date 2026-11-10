import { describe, expect, it } from "vitest";
import {
  PRODUCT_DESCRIPTION_PLACEHOLDER,
  productMetaDescription,
  realProductDescription,
} from "./catalog.service";

describe("realProductDescription", () => {
  it("keeps a real description", () => {
    expect(realProductDescription("  A floral oud.  ")).toBe("A floral oud.");
  });

  it("drops the page placeholder and empty values (never a meta description)", () => {
    expect(realProductDescription(PRODUCT_DESCRIPTION_PLACEHOLDER)).toBeUndefined();
    expect(realProductDescription("")).toBeUndefined();
    expect(realProductDescription(null)).toBeUndefined();
    expect(realProductDescription(undefined)).toBeUndefined();
  });
});

describe("productMetaDescription", () => {
  it("uses short descriptions as plain text", () => {
    expect(productMetaDescription("<p>A floral&nbsp;oud &amp; rose.</p>")).toBe("A floral oud & rose.");
  });

  it("cuts long descriptions at a word near 160 characters", () => {
    const long = "Rich amber and warm vanilla notes ".repeat(10);
    const meta = productMetaDescription(long)!;
    expect(meta.length).toBeLessThanOrEqual(160);
    expect(meta.endsWith("…")).toBe(true);
    expect(long.startsWith(meta.slice(0, -1))).toBe(true);
  });

  it("gives nothing for the placeholder", () => {
    expect(productMetaDescription(PRODUCT_DESCRIPTION_PLACEHOLDER)).toBeUndefined();
  });
});
