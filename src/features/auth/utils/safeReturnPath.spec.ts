import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safeReturnPath";

describe("safeReturnPath", () => {
  it("keeps paths on this site (query and hash too)", () => {
    expect(safeReturnPath("/account/orders")).toBe("/account/orders");
    expect(safeReturnPath("/ar/products/x?size=50#pdp-reviews")).toBe("/ar/products/x?size=50#pdp-reviews");
  });

  it("refuses other sites and odd values (open redirect)", () => {
    for (const bad of [
      "//evil.example",
      "/\\evil.example",
      "https://evil.example",
      "javascript:alert(1)",
      "/\t/evil.example",
      "evil",
      "",
      null,
    ]) {
      expect(safeReturnPath(bad)).toBe("/account");
    }
  });

  it("uses the given fallback", () => {
    expect(safeReturnPath("//x", "/cart")).toBe("/cart");
  });
});
