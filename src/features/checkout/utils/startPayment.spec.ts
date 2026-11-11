import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/orders.service", () => ({
  initiatePayment: vi.fn(),
}));

vi.mock("./checkoutSession", () => ({
  getPayAttempt: () => 1,
  storePaymentTransactionId: vi.fn(),
  storePaymobClientSecret: vi.fn(),
  storePaymobPublicKey: vi.fn(),
  storeStripeClientSecret: vi.fn(),
  storeStripePublishableKey: vi.fn(),
}));

import { initiatePayment } from "../api/orders.service";
import { PaymentGatewayError, PaymentRejectedError, startPayment } from "./startPayment";

describe("startPayment", () => {
  beforeEach(() => {
    vi.mocked(initiatePayment).mockReset();
    vi.stubGlobal("location", { assign: vi.fn(), replace: vi.fn(), origin: "http://localhost:3004" });
  });

  it("sends Test Payment (smoke) to order confirmation after initiate", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "smoke_payment",
      paymentAction: null,
      warnings: [],
    } as never);

    const result = await startPayment("order-1", vi.fn());

    expect(initiatePayment).toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith("/order-confirmation/order-1");
    expect(result.kind).toBe("confirmation");
  });

  it("keeps Stripe card confirm on the checkout page when inline is requested", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "stripe",
      paymentAction: "INLINE_CARD",
      clientSecret: "cs_test",
      metadata: { publishableKey: "pk_test" },
      warnings: [],
    } as never);

    const result = await startPayment("order-2", vi.fn(), {}, { inline: true });

    expect(result).toEqual({
      kind: "inline",
      inline: {
        provider: "stripe",
        orderId: "order-2",
        clientSecret: "cs_test",
        publishableKey: "pk_test",
      },
    });
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("redirects Telr HPP with /payments/telr/return URLs and REDIRECT_REQUIRED", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "telr",
      paymentAction: "REDIRECT_REQUIRED",
      redirectUrl: "https://secure.telr.com/gateway/process.html?o=abc",
      warnings: [],
    } as never);

    const result = await startPayment(
      "order-telr",
      vi.fn(),
      { providerCode: "telr", zonePaymentMethodId: "zpm-1" },
    );

    expect(initiatePayment).toHaveBeenCalledWith(
      "order-telr",
      expect.objectContaining({
        returnUrl: "http://localhost:3004/payments/telr/return",
        cancelUrl: "http://localhost:3004/payments/telr/return?result=cancelled",
        zonePaymentMethodId: "zpm-1",
      }),
    );
    expect(window.location.assign).toHaveBeenCalledWith(
      "https://secure.telr.com/gateway/process.html?o=abc",
    );
    expect(result.kind).toBe("redirect");
  });

  it("redirects Tabby with /payments/tabby/return for both return and cancel", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tabby",
      paymentAction: "REDIRECT",
      redirectUrl: "https://checkout.tabby.ai/?sessionId=abc",
      warnings: [],
      metadata: { tabbyPaymentId: "pay-1" },
    } as never);

    const result = await startPayment(
      "order-tabby",
      vi.fn(),
      { providerCode: "tabby", zonePaymentMethodId: "zpm-tabby" },
    );

    expect(initiatePayment).toHaveBeenCalledWith(
      "order-tabby",
      expect.objectContaining({
        returnUrl: "http://localhost:3004/payments/tabby/return",
        cancelUrl: "http://localhost:3004/payments/tabby/return",
        zonePaymentMethodId: "zpm-tabby",
      }),
    );
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout.tabby.ai/?sessionId=abc");
    expect(result.kind).toBe("redirect");
  });

  it("raises Tabby's own message when Tabby rejects the purchase — never a redirect or confirmation", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tabby",
      paymentAction: null,
      redirectUrl: null,
      paymentStatus: "FAILED",
      warnings: ["Sorry, Tabby is unable to approve this purchase."],
      metadata: {
        tabbyRejectionReason: "not_available",
        tabbyRejectionMessage: { en: "Sorry (en)", ar: "نأسف" },
      },
    } as never);

    const attempt = startPayment("order-tabby", vi.fn(), { providerCode: "tabby" });

    await expect(attempt).rejects.toBeInstanceOf(PaymentRejectedError);
    await expect(attempt).rejects.toMatchObject({ messages: { en: "Sorry (en)", ar: "نأسف" } });
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("treats a Tabby response with no payment page as a gateway error", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tabby",
      paymentAction: null,
      redirectUrl: null,
      warnings: [],
      metadata: {},
    } as never);

    await expect(
      startPayment("order-tabby", vi.fn(), { providerCode: "tabby" }),
    ).rejects.toBeInstanceOf(PaymentGatewayError);
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
