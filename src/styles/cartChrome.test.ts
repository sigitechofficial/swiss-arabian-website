import { describe, expect, it } from "vitest";
import { cartEmptyRails } from "./cartChrome";

describe("cart page chrome", () => {
  it("pulls the empty-bag rails out on the reading side, so /ar/cart does not scroll sideways", () => {
    expect(cartEmptyRails.split(/\s+/)).toContain("-ms-[22px]");
    expect(cartEmptyRails).not.toMatch(/(^|\s)-?m[lr]-/);
  });
});
