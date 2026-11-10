import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPayment } from "./CheckoutPayment";
import { CheckoutShippingMethod } from "./CheckoutShippingMethod";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe("checkout radio accessible names", () => {
  it("names shipping options by display name, not zoneDeliveryMethodId", () => {
    render(
      <CheckoutShippingMethod
        methods={[
          {
            zoneDeliveryMethodId: "0b7f3c1e-5d1a-4c55-9a43-2f1f0e9d3c11",
            deliveryMethodId: "d1",
            partnerCode: "iq_fulfillment",
            methodCode: "iq_standard",
            displayName: "Standard delivery",
            isDefault: true,
            estimatedFee: "0",
          },
        ]}
        selectedId={null}
        status="ready"
        submitting={false}
        currency="AED"
        onSelect={vi.fn()}
      />,
    );
    const radio = screen.getByRole("radio", { name: "Standard delivery" });
    expect(radio.getAttribute("aria-label")).not.toMatch(UUID);
  });

  it("names payment options by display name, not zonePaymentMethodId", () => {
    render(
      <CheckoutPayment
        methods={[
          {
            zonePaymentMethodId: "9a8e1f0c-3b2d-4e5f-8a7b-6c5d4e3f2a1b",
            paymentMethodId: "p1",
            providerCode: "smoke_payment",
            methodCode: "test_pay",
            displayName: "Test Payment (dev only)",
            isDefault: true,
          },
        ]}
        countryCode="AE"
        selectedId={null}
        status="ready"
        submitting={false}
        errorMsg={null}
        onRetry={vi.fn()}
        onSelect={vi.fn()}
        canSubmit={false}
        ctaLabel="Place order"
      />,
    );
    const radio = screen.getByRole("radio", { name: "Test Payment (dev only)" });
    expect(radio.getAttribute("aria-label")).not.toMatch(UUID);
  });
});
