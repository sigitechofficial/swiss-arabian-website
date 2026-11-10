import { describe, expect, it } from "vitest";
import { isHomePath } from "./homePath";

describe("isHomePath", () => {
  it("is the English and Arabic home page only", () => {
    expect(isHomePath("/")).toBe(true);
    expect(isHomePath("/ar")).toBe(true);
    expect(isHomePath("/ar/")).toBe(true);
    expect(isHomePath("/collections/women")).toBe(false);
    expect(isHomePath("/ar/products/ward")).toBe(false);
  });
});
