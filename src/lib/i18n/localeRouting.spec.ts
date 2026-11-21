import { describe, expect, it } from "vitest";
import { isLocaleSwitchablePath } from "./localePath";
import { listingPageParam, localeRouting, publicPathname } from "./localeRouting";
import type { LocaleConfig } from "./locales";

const EN_AR: LocaleConfig = { locales: ["en", "ar"], defaultLocale: "en" };

describe("publicPathname", () => {
  it("turns internal route paths into the public address", () => {
    expect(publicPathname("/en/products", EN_AR)).toBe("/products");
    expect(publicPathname("/en", EN_AR)).toBe("/");
    expect(publicPathname("/en/collections/oud/p/3", EN_AR)).toBe("/collections/oud");
    expect(publicPathname("/ar/products/p/2", EN_AR)).toBe("/ar/products");
  });

  it("keeps public addresses as they are", () => {
    expect(publicPathname("/products", EN_AR)).toBe("/products");
    expect(publicPathname("/ar/collections/oud", EN_AR)).toBe("/ar/collections/oud");
    expect(publicPathname("/", EN_AR)).toBe("/");
  });
});

function route(address: string, config: LocaleConfig = EN_AR) {
  const url = new URL(address, "https://shop.example");
  return localeRouting({
    pathname: url.pathname,
    searchParams: url.searchParams,
    switchable: isLocaleSwitchablePath(url.pathname),
    config,
  });
}

describe("locale routing (proxy)", () => {
  it("serves unprefixed addresses from the default locale's segment", () => {
    expect(route("/")).toEqual({ type: "rewrite", pathname: "/en" });
    expect(route("/products")).toEqual({ type: "rewrite", pathname: "/en/products" });
    expect(route("/checkout")).toEqual({ type: "rewrite", pathname: "/en/checkout" });
  });

  it("lets prefixed addresses through unchanged", () => {
    expect(route("/ar")).toEqual({ type: "next", pathname: "/ar" });
    expect(route("/ar/products/oud")).toEqual({ type: "next", pathname: "/ar/products/oud" });
  });

  it("an unknown language segment is a page of the default locale (a 404 there)", () => {
    expect(route("/de/products")).toEqual({ type: "rewrite", pathname: "/en/de/products" });
  });

  it("sends a language the market does not serve to its default language (temporary)", () => {
    expect(route("/fr/products?sort=new")).toEqual({
      type: "redirect",
      pathname: "/products",
      search: "?sort=new",
      temporary: true,
    });
  });

  it("serves the market's own languages and default (no rebuild for a new language)", () => {
    const withFrench: LocaleConfig = { locales: ["en", "ar", "fr"], defaultLocale: "en" };
    expect(route("/fr/products", withFrench)).toEqual({ type: "next", pathname: "/fr/products" });
    const arabicFirst: LocaleConfig = { locales: ["ar", "en"], defaultLocale: "ar" };
    expect(route("/products", arabicFirst)).toEqual({ type: "rewrite", pathname: "/ar/products" });
    expect(route("/ar/products", arabicFirst)).toEqual({ type: "redirect", pathname: "/products" });
    expect(route("/en/products", arabicFirst)).toEqual({ type: "next", pathname: "/en/products" });
    expect(route("/products?languageCode=en", arabicFirst)).toEqual({
      type: "redirect",
      pathname: "/en/products",
      search: "",
    });
  });

  it("a payment return in a language the market does not serve opens in its default", () => {
    expect(route("/payments/tabby/return?lang=fr")).toEqual({
      type: "rewrite",
      pathname: "/en/payments/tabby/return",
    });
  });

  it("redirects the default locale's prefix to the bare address", () => {
    expect(route("/en/products")).toEqual({ type: "redirect", pathname: "/products" });
    expect(route("/en")).toEqual({ type: "redirect", pathname: "/" });
  });

  it("serves a payment return in the checkout language from ?lang=, keeping the fixed address", () => {
    expect(route("/payments/tabby/return?lang=ar&orderId=o-1&result=cancel")).toEqual({
      type: "rewrite",
      pathname: "/ar/payments/tabby/return",
    });
    expect(route("/payments/tabby/return?lang=en")).toEqual({ type: "rewrite", pathname: "/en/payments/tabby/return" });
    // No or unknown language: the default one.
    expect(route("/payments/tabby/return")).toEqual({ type: "rewrite", pathname: "/en/payments/tabby/return" });
    expect(route("/payments/tabby/return?lang=xx")).toEqual({ type: "rewrite", pathname: "/en/payments/tabby/return" });
    // Shop pages never switch language from ?lang= (their address carries it).
    expect(route("/products?lang=ar")).toEqual({ type: "rewrite", pathname: "/en/products" });
  });

  it("redirects ?languageCode= links to the language's address", () => {
    expect(route("/products/oud?languageCode=AR-sa&utm=x")).toEqual({
      type: "redirect",
      pathname: "/ar/products/oud",
      search: "?utm=x",
    });
    // Checkout and sign-in keep the language too.
    expect(route("/checkout?languageCode=ar")).toEqual({ type: "redirect", pathname: "/ar/checkout", search: "" });
    // Payment providers' fixed return addresses stay as they are.
    expect(route("/payments/tabby/return?languageCode=ar").type).toBe("rewrite");
    // English or unknown languages: no redirect.
    expect(route("/products?languageCode=en").type).toBe("rewrite");
    expect(route("/products?languageCode=de").type).toBe("rewrite");
  });

  it("serves listing page 2+ from its own static route, keeping ?page in the address", () => {
    expect(route("/products?page=3")).toEqual({ type: "rewrite", pathname: "/en/products/p/3" });
    expect(route("/ar/collections/oud?page=2&sort=new")).toEqual({
      type: "rewrite",
      pathname: "/ar/collections/oud/p/2",
    });
    expect(route("/categories/men?page=2")).toEqual({
      type: "rewrite",
      pathname: "/en/categories/men/p/2",
    });
    // Page 1 and other pages keep their own route.
    expect(route("/collections/oud?page=1")).toEqual({ type: "rewrite", pathname: "/en/collections/oud" });
    expect(route("/blog?page=2")).toEqual({ type: "rewrite", pathname: "/en/blog/p/2" });
    expect(route("/ar/blog?page=3")).toEqual({ type: "rewrite", pathname: "/ar/blog/p/3" });
    expect(route("/blog?page=1")).toEqual({ type: "rewrite", pathname: "/en/blog" });
    expect(route("/products/oud?page=2")).toEqual({ type: "rewrite", pathname: "/en/products/oud" });
  });

  it("never exposes the internal page route", () => {
    expect(route("/collections/oud/p/2?sort=new")).toEqual({
      type: "redirect",
      pathname: "/collections/oud",
      search: "?sort=new&page=2",
    });
    expect(route("/blog/p/2")).toEqual({ type: "redirect", pathname: "/blog", search: "?page=2" });
    expect(route("/ar/products/p/4")).toEqual({
      type: "redirect",
      pathname: "/ar/products",
      search: "?page=4",
    });
  });

  it("reads ?page as a whole number", () => {
    expect(listingPageParam("3")).toBe(3);
    expect(listingPageParam("0")).toBe(1);
    expect(listingPageParam("abc")).toBe(1);
    expect(listingPageParam(null)).toBe(1);
  });
});
