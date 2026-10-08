import { describe, expect, it } from "vitest";
import {
  catalogAlternates,
  isLocaleSwitchablePath,
  stripLocalePrefix,
  withLocalePrefix,
} from "./localePath";

describe("locale paths", () => {
  it("keeps the handle and only adds the Arabic prefix", () => {
    expect(withLocalePrefix("/products/vanilla-01", "ar")).toBe("/ar/products/vanilla-01");
    expect(withLocalePrefix("/ar/products/vanilla-01", "en")).toBe("/products/vanilla-01");
    expect(stripLocalePrefix("/ar")).toBe("/");
  });

  it("points Arabic canonical at /ar and English at the bare path", () => {
    expect(catalogAlternates("/ar/products/vanilla-01", "ar")).toEqual({
      canonical: "/ar/products/vanilla-01",
      languages: {
        en: "/products/vanilla-01",
        ar: "/ar/products/vanilla-01",
        "x-default": "/products/vanilla-01",
      },
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
