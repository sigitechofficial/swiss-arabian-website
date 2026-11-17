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
  storeHostedPaymentOpen: vi.fn(),
}));

import { initiatePayment } from "../api/orders.service";
import { ApiClientError } from "@/lib/api/apiError";
import { storeHostedPaymentOpen } from "./checkoutSession";
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

  it("sends the prepared session's account so the backend reuses the session the shopper pays", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "stripe",
      paymentAction: "INLINE_CARD",
      clientSecret: "cs_prepared_secret",
      metadata: { publishableKey: "pk_test" },
      warnings: [],
    } as never);

    await startPayment(
      "order-3",
      vi.fn(),
      {},
      {
        inline: true,
        prepared: {
          provider: "stripe",
          correlationId: "inline-cs-1-stripe-3000",
          clientSecret: "cs_prepared_secret",
          publishableKey: "pk_test",
          providerReference: "cs_test_prepared",
          accountId: "acct-stripe-uae",
        },
      },
    );

    expect(initiatePayment).toHaveBeenCalledWith(
      "order-3",
      expect.objectContaining({
        idempotencyKey: "inline-cs-1-stripe-3000",
        metadata: expect.objectContaining({
          preparedClientSecret: "cs_prepared_secret",
          preparedProvider: "stripe",
          preparedProviderReference: "cs_test_prepared",
          preparedAccountId: "acct-stripe-uae",
        }),
      }),
    );
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

  it("Arabic checkout: Tabby return links and the order carry ar (Tabby QA)", async () => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      replace: vi.fn(),
      origin: "http://localhost:3004",
      pathname: "/ar/checkout",
    });
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tabby",
      paymentAction: "REDIRECT",
      redirectUrl: "https://checkout.tabby.ai/?sessionId=abc",
      warnings: [],
    } as never);
    await startPayment("order-tabby", vi.fn(), { providerCode: "tabby" });
    expect(initiatePayment).toHaveBeenCalledWith(
      "order-tabby",
      expect.objectContaining({
        returnUrl: "http://localhost:3004/payments/tabby/return?lang=ar",
        cancelUrl: "http://localhost:3004/payments/tabby/return?lang=ar",
        locale: "ar",
      }),
    );
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
        returnUrl: "http://localhost:3004/payments/tabby/return?lang=en",
        cancelUrl: "http://localhost:3004/payments/tabby/return?lang=en",
        locale: "en",
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

  it("redirects Tamara with /payments/tamara/return for both return and cancel", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tamara",
      paymentAction: "REDIRECT",
      redirectUrl: "https://checkout-sandbox.tamara.co/checkout/abc",
      warnings: [],
      metadata: { tamara: { checkoutId: "chk-1" } },
    } as never);

    const result = await startPayment(
      "order-tamara",
      vi.fn(),
      { providerCode: "tamara", zonePaymentMethodId: "zpm-tamara" },
    );

    expect(initiatePayment).toHaveBeenCalledWith(
      "order-tamara",
      expect.objectContaining({
        returnUrl: "http://localhost:3004/payments/tamara/return?lang=en",
        cancelUrl: "http://localhost:3004/payments/tamara/return?lang=en",
        locale: "en",
        zonePaymentMethodId: "zpm-tamara",
      }),
    );
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout-sandbox.tamara.co/checkout/abc");
    // Browser Back from Tamara’s page gives the bag back, as for Tabby.
    expect(storeHostedPaymentOpen).toHaveBeenCalledWith("order-tamara");
    expect(result.kind).toBe("redirect");
  });

  it("raises Tamara's own message when Tamara declines — never a redirect or confirmation", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tamara",
      paymentAction: null,
      redirectUrl: null,
      paymentStatus: "FAILED",
      warnings: [],
      metadata: {
        tamara: { rejectionReason: "declined", rejectionMessage: { en: "No (en)", ar: "لا" } },
      },
    } as never);

    const attempt = startPayment("order-tamara", vi.fn(), { providerCode: "tamara" });

    await expect(attempt).rejects.toBeInstanceOf(PaymentRejectedError);
    await expect(attempt).rejects.toMatchObject({ provider: "tamara", messages: { en: "No (en)", ar: "لا" } });
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("refuses a Tamara redirect that is not on tamara.co", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tamara",
      paymentAction: "REDIRECT",
      redirectUrl: "https://evil.example/tamara.co",
      warnings: [],
      metadata: {},
    } as never);

    await expect(
      startPayment("order-tamara", vi.fn(), { providerCode: "tamara" }),
    ).rejects.toBeInstanceOf(PaymentGatewayError);
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("treats a Tamara response with no payment page as a gateway error", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      providerCode: "tamara",
      paymentAction: null,
      redirectUrl: null,
      warnings: [],
      metadata: {},
    } as never);

    await expect(
      startPayment("order-tamara", vi.fn(), { providerCode: "tamara" }),
    ).rejects.toBeInstanceOf(PaymentGatewayError);
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

  it("turns the backend's PAYMENT_FAILED answer into the retry step, not a raw error", async () => {
    vi.mocked(initiatePayment).mockRejectedValue(
      new ApiClientError(422, { code: "PAYMENT_FAILED", message: "This payment method couldn’t be started." } as never),
    );

    await expect(
      startPayment("order-telr", vi.fn(), { providerCode: "telr" }),
    ).rejects.toBeInstanceOf(PaymentGatewayError);
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("passes other errors through unchanged", async () => {
    const other = new ApiClientError(404, { code: "ORDER_NOT_FOUND", message: "Not found" } as never);
    vi.mocked(initiatePayment).mockRejectedValue(other);

    await expect(startPayment("order-x", vi.fn(), { providerCode: "telr" })).rejects.toBe(other);
  });
});
