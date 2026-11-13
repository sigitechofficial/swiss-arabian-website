import { describe, expect, it } from "vitest";
import {
  catalogAlternates,
  internalLocalePath,
  isLocaleSwitchablePath,
  localeFromPathname,
  localePrefixOf,
  localizeHref,
  stripLocalePrefix,
  withLocalePrefix,
} from "./localePath";

describe("locale paths", () => {
  it("keeps the handle and only adds the Arabic prefix", () => {
    expect(withLocalePrefix("/products/vanilla-01", "ar")).toBe("/ar/products/vanilla-01");
    expect(withLocalePrefix("/ar/products/vanilla-01", "en")).toBe("/products/vanilla-01");
    expect(withLocalePrefix("/", "ar")).toBe("/ar");
    expect(stripLocalePrefix("/ar")).toBe("/");
  });

  it("reads the language from the address (default locale: no prefix)", () => {
    expect(localeFromPathname("/ar/products")).toBe("ar");
    expect(localeFromPathname("/products")).toBe("en");
    // Only whole segments count.
    expect(localeFromPathname("/arabica")).toBe("en");
    expect(localePrefixOf("/fr/products")).toBeNull();
  });

  it("treats the internal default-locale route (/en/…) as the bare address", () => {
    expect(localeFromPathname("/en/products")).toBe("en");
    expect(stripLocalePrefix("/en/products")).toBe("/products");
    expect(withLocalePrefix("/en/products", "ar")).toBe("/ar/products");
    expect(internalLocalePath("/products", "en")).toBe("/en/products");
    expect(internalLocalePath("/", "ar")).toBe("/ar");
  });

  it("localizes links for the language being read", () => {
    expect(localizeHref("/products?sort=new#top", "/ar/collections/x")).toBe("/ar/products?sort=new#top");
    expect(localizeHref("/products", "/collections/x")).toBe("/products");
    expect(localizeHref("/checkout", "/ar")).toBe("/ar/checkout");
    expect(localizeHref("/checkout", "/products")).toBe("/checkout");
    expect(localizeHref("/ar/faq", "/")).toBe("/ar/faq");
    expect(localizeHref("https://example.com/x", "/ar")).toBe("https://example.com/x");
  });

  it("lists every configured language and x-default in the alternates", () => {
    expect(catalogAlternates("/ar/products/vanilla-01", "ar")).toEqual({
      canonical: "/ar/products/vanilla-01",
      languages: {
        en: "/products/vanilla-01",
        ar: "/ar/products/vanilla-01",
        "x-default": "/products/vanilla-01",
      },
    });
    expect(catalogAlternates("/", "en")).toEqual({
      canonical: "/",
      languages: { en: "/", ar: "/ar", "x-default": "/" },
    });
  });

  it("keeps the language through checkout, sign-in, tracking and the confirmation", () => {
    for (const path of [
      "/checkout",
      "/checkout/payment/stripe",
      "/checkout/payment/cancel?orderId=1",
      "/login?returnTo=%2Fcart",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify?email=x",
      "/track",
      "/track/SA-1001",
      "/order-confirmation/abc",
    ]) {
      expect(localizeHref(path, "/ar/cart")).toBe(`/ar${path}`);
      expect(localizeHref(path, "/cart")).toBe(path);
      expect(isLocaleSwitchablePath(path.split("?")[0]!)).toBe(true);
    }
  });

  it("leaves the payment providers' fixed return addresses unprefixed", () => {
    expect(isLocaleSwitchablePath("/payments/tabby/return")).toBe(false);
    expect(localizeHref("/payments/telr/return", "/ar")).toBe("/payments/telr/return");
  });

  it("keeps language on shop paths", () => {
    expect(isLocaleSwitchablePath("/products/vanilla-01")).toBe(true);
    expect(isLocaleSwitchablePath("/subscriptions")).toBe(true);
    expect(isLocaleSwitchablePath("/account/orders")).toBe(true);
  });
});
