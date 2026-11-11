import { describe, expect, it } from "vitest";
import { paymentMethodNote, upcomingPaymentMethods, usesHostedRedirect } from "./methodLabels";
import {
  canPrescoreTabby,
  isTabbyPaymentMethod,
  TABBY_REJECTED_MESSAGE,
  tabbyFallbackText,
  tabbyLang,
  tabbyRejectionFrom,
  tabbySnippetConfig,
  tabbyStartFailureMessage,
} from "./tabby";
import type { PaymentMethodOption } from "../types/checkout";

const tabbyMethod: PaymentMethodOption = {
  zonePaymentMethodId: "zpm-tabby",
  paymentMethodId: "pm-tabby",
  providerCode: "tabby",
  methodCode: "tabby_installments",
  displayName: "Pay later with Tabby",
  isDefault: false,
  requiresRedirect: true,
  metadata: {
    tabby: {
      publicKey: "pk_test_x",
      merchantCode: "swissarabian_web_uae",
      region: "UAE",
      currency: "AED",
      snippetScriptBase: "https://checkout.tabby.ai",
      requiresPrescoring: true,
    },
  },
};
const paymob = { ...tabbyMethod, zonePaymentMethodId: "zpm-p", providerCode: "paymob", methodCode: "card", metadata: null };

describe("tabby helpers", () => {
  it("recognises the Tabby method and treats it as a hosted redirect", () => {
    expect(isTabbyPaymentMethod(tabbyMethod)).toBe(true);
    expect(isTabbyPaymentMethod(paymob)).toBe(false);
    expect(usesHostedRedirect({ ...tabbyMethod, requiresRedirect: false })).toBe(true);
    expect(paymentMethodNote(tabbyMethod)).toBe("Pay in 4, interest-free");
  });

  it("reads snippet settings from metadata.tabby", () => {
    expect(tabbySnippetConfig(tabbyMethod)).toEqual({
      publicKey: "pk_test_x",
      merchantCode: "swissarabian_web_uae",
      currency: "AED",
      snippetScriptBase: "https://checkout.tabby.ai",
    });
  });

  it("refuses snippet settings that are incomplete or point off Tabby", () => {
    expect(tabbySnippetConfig({ metadata: null })).toBeNull();
    expect(tabbySnippetConfig({ metadata: { tabby: { publicKey: "pk", merchantCode: "m", currency: "AED" } } })).toBeNull();
    expect(
      tabbySnippetConfig({
        metadata: { tabby: { publicKey: "pk", merchantCode: "m", currency: "AED", snippetScriptBase: "https://evil.example" } },
      }),
    ).toBeNull();
  });

  it("turns a rejected initiate into Tabby's message", () => {
    expect(tabbyRejectionFrom({})).toBeNull();
    expect(tabbyRejectionFrom({ tabbyRejectionReason: "not_available" })).toEqual(TABBY_REJECTED_MESSAGE);
    expect(
      tabbyRejectionFrom({
        tabbyRejectionReason: "order_amount_too_high",
        tabbyRejectionMessage: { en: "Too high", ar: "مرتفع" },
      }),
    ).toEqual({ en: "Too high", ar: "مرتفع" });
  });

  it("only pre-scores with a real email and phone", () => {
    expect(canPrescoreTabby("a@b.co", "+971500000001")).toBe(true);
    expect(canPrescoreTabby("a@b", "+971500000001")).toBe(false);
    expect(canPrescoreTabby("a@b.co", "+9715")).toBe(false);
  });

  it("builds Tabby's fallback wording (total × 1.015 / 4)", () => {
    expect(tabbyFallbackText(400, "AED", "en")).toBe("4 payments of AED 101.50/mo or up to 12 months.");
    expect(tabbyFallbackText(400, "AED", "ar")).toContain("101.50");
  });

  it("maps page language to Tabby language", () => {
    expect(tabbyLang("ar")).toBe("ar");
    expect(tabbyLang("ar-AE")).toBe("ar");
    expect(tabbyLang("en")).toBe("en");
    expect(tabbyLang(null)).toBe("en");
  });

  it("drops the 'coming soon' Tabby row once Tabby is a live method", () => {
    const soon = upcomingPaymentMethods("AE", [paymob]).map((row) => row.id);
    expect(soon).toContain("tabby");
    const live = upcomingPaymentMethods("AE", [paymob, tabbyMethod]).map((row) => row.id);
    expect(live).not.toContain("tabby");
    expect(live).toContain("tamara");
  });
});

describe("tabbyStartFailureMessage", () => {
  it("points at the phone when Tabby rejected it", () => {
    expect(tabbyStartFailureMessage(["buyer.phone: invalid phone number"])).toMatch(/phone number/);
  });

  it("points at the email when Tabby rejected it", () => {
    expect(tabbyStartFailureMessage(["buyer.email is not valid"])).toMatch(/email address/);
  });

  it("falls back to a Tabby (not card) message", () => {
    const message = tabbyStartFailureMessage([]);
    expect(message).toMatch(/^Tabby is unavailable/);
    expect(message).not.toMatch(/card/i);
  });
});
