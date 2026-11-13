import { describe, expect, it } from "vitest";
import { isLocaleSwitchablePath } from "./localePath";
import { listingPageParam, localeRouting, publicPathname } from "./localeRouting";

describe("publicPathname", () => {
  it("turns internal route paths into the public address", () => {
    expect(publicPathname("/en/products")).toBe("/products");
    expect(publicPathname("/en")).toBe("/");
    expect(publicPathname("/en/collections/oud/p/3")).toBe("/collections/oud");
    expect(publicPathname("/ar/products/p/2")).toBe("/ar/products");
  });

  it("keeps public addresses as they are", () => {
    expect(publicPathname("/products")).toBe("/products");
    expect(publicPathname("/ar/collections/oud")).toBe("/ar/collections/oud");
    expect(publicPathname("/")).toBe("/");
  });
});

function route(address: string) {
  const url = new URL(address, "https://shop.example");
  return localeRouting({
    pathname: url.pathname,
    searchParams: url.searchParams,
    switchable: isLocaleSwitchablePath(url.pathname),
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
    expect(route("/fr/products")).toEqual({ type: "rewrite", pathname: "/en/fr/products" });
  });

  it("redirects the default locale's prefix to the bare address", () => {
    expect(route("/en/products")).toEqual({ type: "redirect", pathname: "/products" });
    expect(route("/en")).toEqual({ type: "redirect", pathname: "/" });
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
    expect(route("/blog?page=2")).toEqual({ type: "rewrite", pathname: "/en/blog" });
    expect(route("/products/oud?page=2")).toEqual({ type: "rewrite", pathname: "/en/products/oud" });
  });

  it("never exposes the internal page route", () => {
    expect(route("/collections/oud/p/2?sort=new")).toEqual({
      type: "redirect",
      pathname: "/collections/oud",
      search: "?sort=new&page=2",
    });
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
