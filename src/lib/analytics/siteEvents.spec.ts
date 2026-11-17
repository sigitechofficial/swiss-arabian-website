import { describe, expect, it } from "vitest";
import { viewEventForPath } from "./siteEvents";

describe("viewEventForPath", () => {
  it("names the home, list, cart and checkout views", () => {
    expect(viewEventForPath("/")).toBe("home");
    expect(viewEventForPath("/products")).toBe("list");
    expect(viewEventForPath("/search")).toBe("list");
    expect(viewEventForPath("/collections/oud")).toBe("list");
    expect(viewEventForPath("/cart")).toBe("cart");
    expect(viewEventForPath("/checkout")).toBe("checkout");
    expect(viewEventForPath("/checkout/shipping")).toBe("checkout");
  });

  it("leaves product pages (they report the product) and other pages out", () => {
    expect(viewEventForPath("/products/gharam")).toBeNull();
    expect(viewEventForPath("/account")).toBeNull();
    expect(viewEventForPath("/login")).toBeNull();
  });

  it("does not count the payment result pages as a checkout view", () => {
    expect(viewEventForPath("/checkout/payment/success")).toBeNull();
    expect(viewEventForPath("/checkout/payment/cancel")).toBeNull();
  });
});
