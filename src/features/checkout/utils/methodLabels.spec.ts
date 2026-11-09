import { describe, expect, it } from "vitest";
import { orderPaymentLabel } from "./methodLabels";

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
