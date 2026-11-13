import { describe, expect, it } from "vitest";
import { paymentMethodNote, upcomingPaymentMethods, usesHostedRedirect } from "./methodLabels";
import {
  canPrecheckTamara,
  isTamaraPaymentMethod,
  TAMARA_CANCELLED_MESSAGE,
  TAMARA_NOT_AVAILABLE_MESSAGE,
  TAMARA_REJECTED_MESSAGE,
  tamaraCountry,
  tamaraFallbackText,
  tamaraLang,
  tamaraPrecheckMessage,
  tamaraRejectionFrom,
  tamaraStartFailureMessage,
} from "./tamara";
import { pickOrderId } from "../components/TamaraReturnView";
import type { PaymentMethodOption } from "../types/checkout";

const tamaraMethod: PaymentMethodOption = {
  zonePaymentMethodId: "zpm-tamara",
  paymentMethodId: "pm-tamara",
  providerCode: "tamara",
  methodCode: "tamara_installments",
  displayName: "Pay later with Tamara",
  isDefault: false,
  requiresRedirect: true,
  metadata: null,
};
const paymob = { ...tamaraMethod, zonePaymentMethodId: "zpm-p", providerCode: "paymob", methodCode: "card" };

describe("tamara helpers", () => {
  it("recognises the Tamara method and treats it as a hosted redirect", () => {
    expect(isTamaraPaymentMethod(tamaraMethod)).toBe(true);
    expect(isTamaraPaymentMethod({ providerCode: "", methodCode: "tamara_installments" })).toBe(true);
    expect(isTamaraPaymentMethod(paymob)).toBe(false);
    expect(usesHostedRedirect({ ...tamaraMethod, requiresRedirect: false })).toBe(true);
    expect(paymentMethodNote(tamaraMethod)).toBe("Split in 4, interest-free");
  });

  it("lists Tamara as a real method, never as a Paymob 'coming soon' row", () => {
    expect(upcomingPaymentMethods("AE", [paymob]).map((row) => row.id)).not.toContain("tamara");
    expect(upcomingPaymentMethods("SA", [paymob, tamaraMethod]).map((row) => row.id)).not.toContain("tamara");
  });

  it("reads a decline from metadata.tamara", () => {
    expect(tamaraRejectionFrom(null)).toBeNull();
    expect(tamaraRejectionFrom({})).toBeNull();
    expect(tamaraRejectionFrom({ tamara: { checkoutId: "c-1" } })).toBeNull();
    expect(tamaraRejectionFrom({ tamara: { rejectionReason: "not_available" } })).toEqual(
      TAMARA_NOT_AVAILABLE_MESSAGE,
    );
    expect(tamaraRejectionFrom({ tamara: { rejectionReason: "declined" } })).toEqual(TAMARA_REJECTED_MESSAGE);
    expect(
      tamaraRejectionFrom({
        tamara: { rejectionReason: "declined", rejectionMessage: { en: "No (en)", ar: "لا" } },
      }),
    ).toEqual({ en: "No (en)", ar: "لا" });
    // Backend shape (same as Tabby): flat keys.
    expect(
      tamaraRejectionFrom({
        tamaraRejectionReason: "not eligible",
        tamaraRejectionMessage: { en: "Flat (en)", ar: "مسطح" },
        paymentMethodUnavailable: true,
      }),
    ).toEqual({ en: "Flat (en)", ar: "مسطح" });
    expect(tamaraRejectionFrom({ tamaraRejectionReason: "not_available" })).toEqual(
      TAMARA_NOT_AVAILABLE_MESSAGE,
    );
  });

  it("builds the pre-check message from either response shape", () => {
    expect(tamaraPrecheckMessage({ rejectionReason: "x", messageEn: "E", messageAr: "ع" })).toEqual({
      en: "E",
      ar: "ع",
    });
    expect(tamaraPrecheckMessage({ message: { en: "E2", ar: "ع2" } })).toEqual({ en: "E2", ar: "ع2" });
    expect(tamaraPrecheckMessage({ rejectionReason: "cancel" })).toEqual(TAMARA_CANCELLED_MESSAGE);
    expect(tamaraPrecheckMessage({})).toEqual(TAMARA_NOT_AVAILABLE_MESSAGE);
  });

  it("has EN and AR wording for every message", () => {
    for (const message of [TAMARA_NOT_AVAILABLE_MESSAGE, TAMARA_REJECTED_MESSAGE, TAMARA_CANCELLED_MESSAGE]) {
      expect(message.en).toMatch(/Tamara/);
      expect(message.ar).toMatch(/تمارا/);
    }
  });

  it("only pre-checks with a real email and phone", () => {
    expect(canPrecheckTamara("a@b.co", "+971500000001")).toBe(true);
    expect(canPrecheckTamara("a@b", "+971500000001")).toBe(false);
    expect(canPrecheckTamara("a@b.co", "+9715")).toBe(false);
  });

  it("maps currency to Tamara's country and page language to Tamara language", () => {
    expect(tamaraCountry("aed")).toBe("AE");
    expect(tamaraCountry("SAR")).toBe("SA");
    expect(tamaraCountry("KWD")).toBeNull();
    expect(tamaraLang("ar-SA")).toBe("ar");
    expect(tamaraLang(undefined)).toBe("en");
  });

  it("splits the total in four for the fallback wording", () => {
    expect(tamaraFallbackText(400, "AED", "en")).toBe("Split into 4 interest-free payments of AED 100.00 with Tamara.");
    expect(tamaraFallbackText(400, "SAR", "ar")).toContain("100.00");
  });

  it("names the detail Tamara could not accept", () => {
    expect(tamaraStartFailureMessage(["consumer.phone_number invalid"])).toMatch(/phone number/);
    expect(tamaraStartFailureMessage(["email is not valid"])).toMatch(/email address/);
    expect(tamaraStartFailureMessage([])).toMatch(/^Tamara is unavailable/);
  });
});

describe("pickOrderId (Tamara return)", () => {
  const ours = "11111111-1111-4111-8111-111111111111";
  const theirs = "22222222-2222-4222-8222-222222222222";

  it("keeps our order id when Tamara appends its own", () => {
    expect(pickOrderId([ours, theirs], null)).toBe(ours);
    expect(pickOrderId([theirs, ours], ours)).toBe(ours);
  });

  it("falls back to the stored order", () => {
    expect(pickOrderId([], ours)).toBe(ours);
    expect(pickOrderId(["not-a-uuid"], null)).toBeNull();
  });
});
