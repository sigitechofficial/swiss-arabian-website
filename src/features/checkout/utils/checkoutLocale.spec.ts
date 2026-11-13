import { beforeEach, describe, expect, it } from "vitest";
import { checkoutHref, rememberCheckoutLocale, storedCheckoutLocale } from "./checkoutLocale";

beforeEach(() => sessionStorage.clear());

describe("checkout language across the payment round-trip", () => {
  it("uses the language of the page the shopper is on", () => {
    expect(checkoutHref("/order-confirmation/abc", "/ar/checkout")).toBe("/ar/order-confirmation/abc");
    expect(checkoutHref("/checkout/payment/stripe", "/ar/checkout")).toBe("/ar/checkout/payment/stripe");
    expect(checkoutHref("/order-confirmation/abc", "/checkout")).toBe("/order-confirmation/abc");
    expect(checkoutHref("https://checkout.provider.test/pay", "/ar/checkout")).toBe("https://checkout.provider.test/pay");
  });

  it("on a provider's fixed return address, uses the language checkout started in", () => {
    expect(checkoutHref("/order-confirmation/abc", "/payments/tabby/return")).toBe("/order-confirmation/abc");
    rememberCheckoutLocale("/ar/checkout");
    expect(storedCheckoutLocale()).toBe("ar");
    expect(checkoutHref("/order-confirmation/abc", "/payments/tabby/return")).toBe("/ar/order-confirmation/abc");
    rememberCheckoutLocale("/checkout");
    expect(checkoutHref("/order-confirmation/abc", "/payments/telr/return")).toBe("/order-confirmation/abc");
  });
});
