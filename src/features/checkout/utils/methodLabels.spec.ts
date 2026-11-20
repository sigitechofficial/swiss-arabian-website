import { describe, expect, it } from "vitest";
import { deliveryFeeLabel, orderDeliveryLabel, orderPaymentLabel, paymentStepKinds } from "./methodLabels";
import type { DeliveryMethodOption, PaymentMethodOption } from "../types/checkout";

describe("orderPaymentLabel", () => {
  it("shows the backend display name instead of the provider code", () => {
    expect(
      orderPaymentLabel({ providerCode: "smoke_payment", methodCode: "test_pay", displayName: "Test Payment (dev only)" }),
    ).toBe("Test Payment (dev only)");
  });

  it("falls back to codes for older responses without displayName", () => {
    expect(orderPaymentLabel({ providerCode: "stripe", methodCode: null })).toBe("Card · Stripe");
  });

  it("renders a dash without a method", () => {
    expect(orderPaymentLabel(null)).toBe("—");
  });
});

describe("deliveryFeeLabel", () => {
  const method = (estimatedFee: string | null): DeliveryMethodOption => ({
    zoneDeliveryMethodId: "z",
    deliveryMethodId: "d",
    partnerCode: "p",
    methodCode: "m",
    displayName: "Standard delivery",
    isDefault: true,
    estimatedFee,
  });

  it("shows the price when the market sets a fee", () => {
    expect(deliveryFeeLabel(method("15.00"), "AED")).toMatch(/15/);
  });

  it("says Free only for an explicit zero fee", () => {
    expect(deliveryFeeLabel(method("0"), "AED")).toBe("Free");
    expect(deliveryFeeLabel(method("0.00"), "AED")).toBe("Free");
  });

  it("shows no price when the fee is missing (not priced yet), never Free", () => {
    expect(deliveryFeeLabel(method(null), "AED")).toBe("");
    expect(deliveryFeeLabel(method(""), "AED")).toBe("");
  });
});

describe("orderDeliveryLabel", () => {
  it("drops every leading word shared with the partner code", () => {
    expect(orderDeliveryLabel({ partnerCode: "iq_fulfillment", methodCode: "iq_standard" })).toBe("Standard delivery");
    expect(orderDeliveryLabel({ partnerCode: "smoke_standard", methodCode: "smoke_standard_standard" })).toBe("Standard delivery");
    expect(orderDeliveryLabel({ partnerCode: "sapil_demo_courier", methodCode: "sapil_demo_express" })).toBe("Express delivery");
  });

  it("keeps a code that shares nothing with the partner", () => {
    expect(orderDeliveryLabel({ partnerCode: "iq_fulfillment", methodCode: "standard" })).toBe("Standard delivery");
    expect(orderDeliveryLabel({ partnerCode: "aramex", methodCode: "click_and_collect" })).toBe("Click And Collect");
  });

  it("falls back when there is no method code", () => {
    expect(orderDeliveryLabel(null)).toBe("Standard delivery");
  });
});

describe("paymentStepKinds (SE-8)", () => {
  const m = (providerCode: string, methodCode: string, displayName: string, extra: Partial<PaymentMethodOption> = {}) =>
    ({ zonePaymentMethodId: methodCode, paymentMethodId: methodCode, providerCode, methodCode, displayName, ...extra }) as PaymentMethodOption;

  it("lists only what the market offers, in a fixed order", () => {
    expect(
      paymentStepKinds([
        m("cash_on_delivery", "cod", "Cash on Delivery"),
        m("telr", "telr_card", "Card (Telr)"),
        m("paymob", "paymob_card", "Card"),
        m("smoke_payment", "test_pay", "Test Payment (dev only)"),
      ]),
    ).toEqual(["card", "cash"]);
  });

  it("includes Tabby only when Tabby is a live method", () => {
    expect(paymentStepKinds([m("tabby", "tabby_installments", "Pay later with Tabby"), m("stripe", "stripe_card", "Card")])).toEqual([
      "card",
      "tabby",
    ]);
    expect(paymentStepKinds([m("tabby", "tabby_installments", "Tabby", { isEnabled: false })])).toEqual([]);
  });

  it("includes Tamara only when Tamara is a live method", () => {
    expect(
      paymentStepKinds([
        m("cash_on_delivery", "cod", "Cash on Delivery"),
        m("tamara", "tamara_installments", "Tamara"),
        m("tabby", "tabby_installments", "Pay later with Tabby"),
        m("stripe", "stripe_card", "Card"),
      ]),
    ).toEqual(["card", "tabby", "tamara", "cash"]);
    expect(paymentStepKinds([m("tamara", "tamara_installments", "Tamara", { isEnabled: false })])).toEqual([]);
  });
});
