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
import { startPayment } from "./startPayment";

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
});
