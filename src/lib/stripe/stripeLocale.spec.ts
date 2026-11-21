import { describe, expect, it, vi } from "vitest";
import { STRIPE_ELEMENTS_LOCALES, stripeElementsLocale } from "./stripeLocale";

const loadStripe = vi.fn((key: string, options?: { locale?: string }) => Promise.resolve({ key, locale: options?.locale }));
vi.mock("@stripe/stripe-js", () => ({ loadStripe: (key: string, options?: { locale?: string }) => loadStripe(key, options) }));

describe("Stripe form language", () => {
  it.each([
    ["ar", "ar"],
    ["ar-AE", "ar"],
    ["fr", "fr"],
    ["fr-CA", "fr-CA"],
    ["en-AE", "en"],
    ["pt-PT", "pt"],
    ["ur", "en"],
    [null, "en"],
    ["", "en"],
  ])("%s → %s", (shop, stripe) => {
    expect(stripeElementsLocale(shop)).toBe(stripe);
  });

  it("only ever uses a language Stripe lists, never the browser's (auto)", () => {
    for (const code of ["ar", "fa", "ku", "sw", "de-CH", "xx"]) {
      expect(STRIPE_ELEMENTS_LOCALES).toContain(stripeElementsLocale(code));
    }
    expect(STRIPE_ELEMENTS_LOCALES).not.toContain("auto");
  });

  it("loads Stripe.js in the page language, one instance per key and language", async () => {
    const { getStripe } = await import("./getStripe");
    document.documentElement.lang = "ar";
    await getStripe("pk_test_lang");
    await getStripe("pk_test_lang");
    expect(loadStripe).toHaveBeenCalledTimes(1);
    expect(loadStripe).toHaveBeenLastCalledWith("pk_test_lang", { locale: "ar" });
    document.documentElement.lang = "fr";
    await getStripe("pk_test_lang");
    expect(loadStripe).toHaveBeenLastCalledWith("pk_test_lang", { locale: "fr" });
    expect(loadStripe).toHaveBeenCalledTimes(2);
  });
});
