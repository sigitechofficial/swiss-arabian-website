import { describe, expect, it } from "vitest";
import type { PaymentMethodOption } from "../types/checkout";
import { orderConfirmationDetails, orderPaymentState, paysOffline } from "../hooks/useOrderConfirmation";
import type { OrderResponse } from "../types/checkout";
import { defaultRowKey, paymentGroups } from "./paymentOptions";

function method(partial: Partial<PaymentMethodOption>): PaymentMethodOption {
  return {
    zonePaymentMethodId: "z",
    paymentMethodId: "p",
    providerCode: "",
    methodCode: "",
    displayName: "",
    isDefault: false,
    ...partial,
  };
}

describe("paymentGroups", () => {
  const stripe = method({ zonePaymentMethodId: "z-stripe", providerCode: "stripe", methodCode: "stripe_card", displayName: "Card" });
  const cod = method({ zonePaymentMethodId: "z-cod", providerCode: "cod", methodCode: "cod", displayName: "Cash on delivery" });

  it("splits Stripe into wallet and card rows, each tagged with its kind and method", () => {
    const groups = paymentGroups([stripe, cod], "AE", { state: "idle" }, "en");
    const stripeRows = groups.find((g) => g.id === "stripe")!.rows;
    expect(stripeRows.map((r) => r.kind)).toEqual(["apple_pay", "google_pay", "card"]);
    expect(stripeRows.every((r) => r.method === stripe)).toBe(true);
    const other = groups.find((g) => g.id === "other")!.rows;
    expect(other).toEqual([expect.objectContaining({ kind: "method", key: "z-cod", method: cod })]);
  });

  it("disables Tabby when pre-scoring rejects the shopper", () => {
    const tabby = method({ zonePaymentMethodId: "z-tabby", providerCode: "tabby", methodCode: "tabby_installments", displayName: "Tabby" });
    const rows = paymentGroups([tabby], "AE", { state: "rejected", message: { en: "No", ar: "لا" } }, "ar").flatMap((g) => g.rows);
    const row = rows.find((r) => r.key === "z-tabby")!;
    expect(row.disabled).toBe(true);
    expect(row.tabbyState).toBe("rejected");
    expect(row.tabbyMessage).toBe("لا");
  });

  it("opens the card row by default for card providers", () => {
    expect(defaultRowKey(stripe)).toBe("card@stripe");
    expect(defaultRowKey(cod)).toBe("z-cod");
  });
});

describe("order confirmation", () => {
  it("reads payment states and cash on delivery", () => {
    expect(orderPaymentState("PAID")).toBe("success");
    expect(orderPaymentState("DECLINED")).toBe("failed");
    expect(orderPaymentState("PENDING")).toBe("pending");
    expect(paysOffline({ providerCode: "cod", methodCode: "cod" })).toBe(true);
    expect(paysOffline({ providerCode: "stripe", methodCode: "stripe_card" })).toBe(false);
  });

  it("derives the greeting, links and tracker position from the order", () => {
    const order = {
      orderId: "o-1",
      orderNumber: "SP-1",
      status: "PAYMENT_PENDING",
      customer: { customerId: null, email: "a@b.c", fullName: "Mariam Al Falasi", isGuest: true },
      addresses: [],
      lines: [{ quantity: "2" }, { quantity: "1" }],
    } as unknown as OrderResponse;
    const details = orderConfirmationDetails(order, "success");
    expect(details.firstName).toBe("Mariam");
    expect(details.trackHref).toBe("/track/SP-1");
    expect(details.itemCount).toBe(3);
    // Paid but still PAYMENT_PENDING: never behind "Confirmed".
    expect(details.currentStep).toBe(1);
  });
});
