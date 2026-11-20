import { describe, expect, it } from "vitest";
import {
  deliveryFeeLabel,
  deliveryOptionTitles,
  orderDeliveryLabel,
  orderPaymentLabel,
  paymentStepKinds,
  upcomingPaymentMethods,
} from "./methodLabels";
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

  it("reads the name in the page's language from displayNames", () => {
    const method = {
      providerCode: "cod",
      methodCode: "cash_on_delivery",
      displayName: "Cash on Delivery",
      displayNames: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
    };
    expect(orderPaymentLabel(method, undefined, "ar")).toBe("الدفع عند الاستلام");
    expect(orderPaymentLabel(method, undefined, "fr")).toBe("Cash on Delivery");
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

  it("uses the backend's name in the page's language before the code", () => {
    const method = {
      partnerCode: "iq_fulfillment",
      methodCode: "express",
      displayName: "Express delivery",
      displayNames: { en: "Express delivery", ar: "توصيل سريع" },
    };
    expect(orderDeliveryLabel(method, undefined, "ar-AE")).toBe("توصيل سريع");
    expect(orderDeliveryLabel(method, undefined, "en")).toBe("Express delivery");
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

describe("payment methods are told apart by type and codes, never by name", () => {
  const m = (providerCode: string, methodCode: string, displayName: string, methodType?: string) =>
    ({ zonePaymentMethodId: methodCode, paymentMethodId: methodCode, providerCode, methodCode, displayName, methodType }) as PaymentMethodOption;

  it("classifies Arabic-named methods by methodType", () => {
    expect(
      paymentStepKinds([
        m("cod", "cash_on_delivery", "الدفع عند الاستلام", "CASH_ON_DELIVERY"),
        m("checkout", "visa_master", "بطاقة ائتمان أو خصم", "CARD"),
      ]),
    ).toEqual(["card", "cash"]);
  });

  it("does not take a renamed method for cash", () => {
    expect(paymentStepKinds([m("paymob", "wallet", "Cash-free wallet", "WALLET")])).toEqual([]);
  });

  it("knows the market already offers cash on delivery whatever its name", () => {
    const rows = upcomingPaymentMethods("AE", [m("cod", "cash_on_delivery", "الدفع عند الاستلام", "CASH_ON_DELIVERY")]);
    expect(rows.find((row) => row.id === "cash-on-delivery")).toBeUndefined();
  });
});

describe("deliveryOptionTitles", () => {
  const d = (id: string, partnerCode: string, displayName: string): DeliveryMethodOption => ({
    zoneDeliveryMethodId: id,
    deliveryMethodId: id,
    partnerCode,
    methodCode: "standard",
    displayName,
    isDefault: false,
    estimatedFee: null,
  });

  it("keeps distinct localized names as they are", () => {
    const titles = deliveryOptionTitles([d("a", "iq_fulfillment", "توصيل عادي"), d("b", "aramex", "توصيل سريع")]);
    expect([...titles.values()]).toEqual(["توصيل عادي", "توصيل سريع"]);
  });

  it("adds only the partner's name, with no words of another language, when names collide", () => {
    const titles = deliveryOptionTitles([d("a", "iq_fulfillment", "توصيل عادي"), d("b", "aramex", "توصيل عادي")]);
    expect(titles.get("a")).toBe("توصيل عادي · Iq Fulfillment");
    expect(titles.get("b")).toBe("توصيل عادي · Aramex");
  });
});
