import { describe, expect, it } from "vitest";
import { deliveryFeeLabel, orderPaymentLabel } from "./methodLabels";
import type { DeliveryMethodOption } from "../types/checkout";

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
