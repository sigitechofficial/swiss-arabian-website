import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { apiGet, apiPost } from "@/lib/api/apiClient";
import { beginSubscriptionCheckout, readSubscriptionCheckout } from "../api/subscription.api";
import type { DeliveryMethodOption } from "@/features/checkout/types/checkout";
import {
  beginCheckoutBody,
  lockedCheckoutAddress,
  shouldBeginSubscriptionCheckout,
  subscriptionCheckoutResultCopy,
  subscriptionCheckoutSucceeded,
  subscriptionCheckoutTestKey,
  subscriptionDeliveryChoices,
  subscriptionPayToday,
} from "./subscriptionCheckout";

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const view = {
  subscriptionId: "sub-1",
  cycleReference: "sub:sub-1:cycle:1",
  chargeMode: "CUSTOMER_PRESENT",
  status: "PENDING_ACTIVATION",
  billingEnabled: false,
  currencyCode: "AED",
  amount: "65.00",
  shippingAmount: "10.00",
  monthlyTotal: "75.00",
  publishableKey: "pk_test_swiss",
  clientSecret: null,
  paymentState: "NOT_STARTED" as const,
};

describe("subscription checkout", () => {
  it("shows the backend shipping total and pay-today amount", () => {
    expect(subscriptionPayToday(view)).toEqual({
      subscription: "AED 65.00",
      shipping: "AED 10.00",
      payToday: "AED 75.00",
    });
    expect(subscriptionPayToday({ ...view, shippingAmount: "0.00", monthlyTotal: "65.00" }).shipping).toBe("Included");
  });

  it("locks an existing agreement address and leaves a new checkout open", () => {
    expect(lockedCheckoutAddress("addr-1")).toEqual({ locked: true, addressId: "addr-1" });
    expect(lockedCheckoutAddress(null)).toEqual({ locked: false, addressId: null });
  });

  it("posts one PaymentIntent body and then only reads", async () => {
    const body = beginCheckoutBody({
      zoneCode: "UAE",
      consentTextVersion: "s6b4-e765649c",
      recurringUseAccepted: true,
      deliveryMethodCode: "standard",
    });
    expect(body).toEqual({
      zoneCode: "UAE",
      recurringUseAccepted: true,
      consentTextVersion: "s6b4-e765649c",
      deliveryMethodCode: "standard",
    });
    expect(body).not.toHaveProperty("amount");
    expect(beginCheckoutBody({ zoneCode: "UAE", consentTextVersion: "v", recurringUseAccepted: false, deliveryMethodCode: "standard" })).toBeNull();
    expect(beginCheckoutBody({ zoneCode: "UAE", consentTextVersion: "v", recurringUseAccepted: true, deliveryMethodCode: " " })).toBeNull();
    expect(shouldBeginSubscriptionCheckout({ alreadyPosted: false, view: null })).toBe(false);
    expect(shouldBeginSubscriptionCheckout({ alreadyPosted: false, view })).toBe(true);
    expect(shouldBeginSubscriptionCheckout({ alreadyPosted: true, view })).toBe(false);
    expect(shouldBeginSubscriptionCheckout({ alreadyPosted: false, view: { ...view, clientSecret: "pi_1_secret_a" } })).toBe(false);
    expect(subscriptionCheckoutTestKey("pk_test_swiss")).toBe("pk_test_swiss");
    expect(subscriptionCheckoutTestKey("pk_live_swiss")).toBeNull();

    vi.mocked(apiPost).mockResolvedValue({ ...view, clientSecret: "pi_1_secret_a" });
    vi.mocked(apiGet).mockResolvedValue({ ...view, paymentState: "SUCCESS", status: "ACTIVE", clientSecret: "pi_1_secret_a" });
    await beginSubscriptionCheckout("sub-1", body!);
    await readSubscriptionCheckout("sub-1", "UAE");
    expect(apiPost).toHaveBeenCalledWith("/storefront/subscriptions/sub-1/checkout", body);
    expect(apiGet).toHaveBeenCalledWith("/storefront/subscriptions/sub-1/checkout?zoneCode=UAE");
    expect(vi.mocked(apiPost).mock.calls.some((call) => String(call[0]).includes("first-payment"))).toBe(false);
  });

  it("shows the plan shipping amount on retail method cards and ignores courier rates", () => {
    const methods: DeliveryMethodOption[] = [
      {
        zoneDeliveryMethodId: "zone-method-1",
        deliveryMethodId: "method-1",
        partnerCode: "operational_partner",
        methodCode: "standard",
        displayName: "Standard delivery",
        isDefault: true,
        estimatedFee: "100.00",
        metadata: { estimatedMinDays: 2, estimatedMaxDays: 4 },
      },
    ];
    expect(subscriptionDeliveryChoices(methods, "0.00")[0].estimatedFee).toBeNull();
    expect(subscriptionDeliveryChoices(methods, "15.00")[0].estimatedFee).toBe("15.00");
    expect(subscriptionDeliveryChoices(methods, "15.00")[0].displayName).toBe("Standard delivery");
  });

  it("treats only an active successful payment as activated", () => {
    expect(subscriptionCheckoutSucceeded({ paymentState: "SUCCESS", status: "ACTIVE" })).toBe(true);
    expect(subscriptionCheckoutSucceeded({ paymentState: "SUCCESS", status: "PENDING_ACTIVATION" })).toBe(false);
    expect(subscriptionCheckoutSucceeded({ paymentState: "PROCESSING", status: "ACTIVE" })).toBe(false);
    expect(subscriptionCheckoutResultCopy({ paymentState: "SUCCESS", status: "ACTIVE" })).toContain("Subscription activated");
    expect(subscriptionCheckoutResultCopy({ paymentState: "SUCCESS", status: "ACTIVE" })).not.toContain("Order placed");
    expect(subscriptionCheckoutResultCopy({ paymentState: "FAILED", status: "PENDING_ACTIVATION" })).toContain("Payment failed");
  });

  it("keeps subscription checkout off the retail cart and saved-card flow", () => {
    const source = readFileSync(resolve("src/features/subscriptions/components/SubscriptionCheckoutPageView.tsx"), "utf8");
    const page = readFileSync(resolve("src/features/subscriptions/components/SubscriptionsPageView.tsx"), "utf8");
    expect(source).not.toContain("useCheckout");
    expect(source).not.toContain("startFirstPayment");
    expect(source).not.toContain("setup-session");
    expect(source).toContain("CheckoutShippingMethod");
    expect(source).not.toContain("features/checkout/components/CheckoutPageView");
    expect(page).not.toContain("SubscriptionCardSetup");
    expect(page).not.toContain("registerSubscription");
  });
});
