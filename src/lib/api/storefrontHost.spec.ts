import { describe, expect, it } from "vitest";
import { storefrontHostFromHeaderValues } from "./storefrontHost";

describe("storefront host", () => {
  it("prefers the first forwarded host and keeps a non-default port", () => {
    expect(
      storefrontHostFromHeaderValues(
        "shop.example:8443, internal.proxy",
        "localhost:3000",
      ),
    ).toBe("shop.example:8443");
  });

  it("uses the incoming host when nothing was forwarded", () => {
    expect(storefrontHostFromHeaderValues(null, "swissarabian.com")).toBe(
      "swissarabian.com",
    );
  });

  it("does not invent a host when both headers are missing", () => {
    expect(storefrontHostFromHeaderValues(undefined, "  ")).toBeNull();
    expect(storefrontHostFromHeaderValues("", null)).toBeNull();
  });
});
