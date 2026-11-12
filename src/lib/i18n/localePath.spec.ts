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
    expect(localizeHref("/checkout", "/ar")).toBe("/checkout");
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

  it("keeps language on shop paths and leaves checkout and sign-in alone", () => {
    expect(isLocaleSwitchablePath("/checkout")).toBe(false);
    expect(isLocaleSwitchablePath("/login")).toBe(false);
    expect(isLocaleSwitchablePath("/products/vanilla-01")).toBe(true);
    expect(isLocaleSwitchablePath("/subscriptions")).toBe(true);
    expect(isLocaleSwitchablePath("/account/orders")).toBe(true);
  });
});
