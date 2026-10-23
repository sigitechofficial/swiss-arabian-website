import { describe, expect, it, vi } from "vitest";

import type { FirstPaymentSnapshot } from "../api/subscription.api";
import {
  firstPaymentBody,
  firstPaymentMessage,
  reusableInstrument,
  settleFirstPayment,
  shouldPostFirstPayment,
  subscriptionActivated,
} from "./firstPayment";

function view(outcome: FirstPaymentSnapshot["cycle"]["outcome"], status = "PENDING_ACTIVATION", clientSecret: string | null = null): FirstPaymentSnapshot {
  return {
    subscriptionId: "sub-1",
    status,
    billingEnabled: status === "ACTIVE",
    nextBillingAt: null,
    currencyCode: "AED",
    amount: "65.00",
    shippingMode: "EXTRA_FIXED",
    shippingAmount: "10.00",
    monthlyTotal: "75.00",
    paymentInstrumentId: "inst-1",
    cycle: {
      cycleNumber: 1,
      cycleReference: outcome === "NOT_STARTED" ? null : "sub:sub-1:cycle:1",
      status: outcome,
      totalAmount: outcome === "NOT_STARTED" ? null : "75.00",
      paymentTransactionId: outcome === "SUCCESS" ? "txn-1" : null,
      outcome,
    },
    clientSecret,
  };
}

describe("first subscription payment", () => {
  it("posts the saved agreement and active card once", async () => {
    const read = vi.fn()
      .mockResolvedValueOnce(view("NOT_STARTED"))
      .mockResolvedValueOnce(view("SUCCESS", "ACTIVE"));
    const start = vi.fn().mockResolvedValue(view("SUCCESS", "ACTIVE"));
    const result = await settleFirstPayment({
      subscriptionId: "sub-1",
      zoneCode: "UAE",
      paymentInstrumentId: "inst-1",
      read,
      start,
      wait: async () => undefined,
    });
    expect(shouldPostFirstPayment("NOT_STARTED")).toBe(true);
    expect(shouldPostFirstPayment("FAILED")).toBe(false);
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith("sub-1", firstPaymentBody("UAE", "inst-1"));
    expect(start.mock.calls[0][1]).toEqual({ zoneCode: "UAE", paymentInstrumentId: "inst-1" });
    expect(subscriptionActivated(result)).toBe(true);
    expect(firstPaymentMessage(result)).toMatch(/Subscription activated/);
    expect(firstPaymentMessage(result)).toMatch(/no order has been placed/i);
    expect(JSON.stringify(start.mock.calls)).not.toMatch(/order|checkout/i);
  });

  it("does not start another charge for a failed or reconciliation result", async () => {
    const read = vi.fn().mockResolvedValue(view("FAILED"));
    const start = vi.fn();
    const failed = await settleFirstPayment({
      subscriptionId: "sub-1",
      zoneCode: "UAE",
      paymentInstrumentId: "inst-1",
      read,
      start,
      wait: async () => undefined,
    });
    expect(start).not.toHaveBeenCalled();
    expect(firstPaymentMessage(failed)).toMatch(/No new charge/);

    read.mockResolvedValue(view("RECONCILIATION_REQUIRED"));
    const held = await settleFirstPayment({
      subscriptionId: "sub-1",
      zoneCode: "UAE",
      paymentInstrumentId: "inst-1",
      read,
      start,
      wait: async () => undefined,
    });
    expect(start).not.toHaveBeenCalled();
    expect(firstPaymentMessage(held)).toMatch(/needs support/);
  });

  it("confirms bank authentication and trusts the following backend read", async () => {
    const read = vi.fn()
      .mockResolvedValueOnce(view("NOT_STARTED"))
      .mockResolvedValueOnce(view("PROCESSING"))
      .mockResolvedValueOnce(view("SUCCESS", "ACTIVE"));
    const start = vi.fn().mockResolvedValue(view("REQUIRES_CUSTOMER_ACTION", "PENDING_ACTIVATION", "pi_secret"));
    const confirmAction = vi.fn().mockResolvedValue(undefined);
    const result = await settleFirstPayment({
      subscriptionId: "sub-1",
      zoneCode: "UAE",
      paymentInstrumentId: "inst-1",
      read,
      start,
      confirmAction,
      wait: async () => undefined,
    });
    expect(confirmAction).toHaveBeenCalledWith("pi_secret");
    expect(start).toHaveBeenCalledTimes(1);
    expect(read.mock.calls.length).toBeGreaterThan(1);
    expect(subscriptionActivated(result)).toBe(true);
    expect(reusableInstrument(
      [{ id: "old", status: "ACTIVE", createdAt: "2026-10-01" }, { id: "new", status: "PENDING_SETUP", createdAt: "2026-10-02" }],
      "new",
    )).toBe("old");
  });
});
