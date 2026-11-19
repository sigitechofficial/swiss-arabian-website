import { describe, expect, it } from "vitest";
import { isHomePath, isProductPath } from "./homePath";

describe("isHomePath", () => {
  it("is the English and Arabic home page only", () => {
    expect(isHomePath("/")).toBe(true);
    expect(isHomePath("/ar")).toBe(true);
    expect(isHomePath("/ar/")).toBe(true);
    expect(isHomePath("/collections/women")).toBe(false);
    expect(isHomePath("/ar/products/ward")).toBe(false);
  });
});

describe("isProductPath", () => {
  it("is a product page in any language, nothing else", () => {
    expect(isProductPath("/products/rose-01")).toBe(true);
    expect(isProductPath("/ar/products/rose-01/")).toBe(true);
    expect(isProductPath("/products")).toBe(false);
    expect(isProductPath("/collections/women")).toBe(false);
    expect(isProductPath("/")).toBe(false);
  });
});
