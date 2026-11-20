import { describe, expect, it } from "vitest";
import { providerTextIn, readProviderText } from "./providerText";
import { tabbyRejectionFrom, TABBY_REJECTED_MESSAGE } from "./tabby";
import { tamaraPrecheckMessage } from "./tamara";

describe("provider texts in any language", () => {
  it("keeps every language the backend sends, English required", () => {
    expect(readProviderText({ en: "No", ar: "لا", fr: "Non", de: "  " })).toEqual({ en: "No", ar: "لا", fr: "Non" });
    expect(readProviderText({ ar: "لا" })).toBeNull();
    expect(readProviderText("No")).toBeNull();
  });

  it("shows the provider's language, else English", () => {
    const text = { en: "No", ar: "لا" };
    expect(providerTextIn(text, "ar")).toBe("لا");
    expect(providerTextIn(text, "fr")).toBe("No");
  });

  it("uses the backend's reason-specific text even when a language is missing", () => {
    // A new payment text written in English only must not fall back to the generic wording.
    expect(
      tabbyRejectionFrom({ tabbyRejectionReason: "order_amount_too_high", tabbyRejectionMessage: { en: "Over your limit" } }),
    ).toEqual({ en: "Over your limit" });
    expect(tabbyRejectionFrom({ tabbyRejectionReason: "x", tabbyRejectionMessage: { ar: "لا" } })).toBe(
      TABBY_REJECTED_MESSAGE,
    );
    expect(tamaraPrecheckMessage({ rejectionReason: "declined", message: { en: "Declined by Tamara", fr: "Refusé" } })).toEqual({
      en: "Declined by Tamara",
      fr: "Refusé",
    });
  });
});
