import { describe, expect, it } from "vitest";
import { cancelItemsOutcome, cancelOutcome, readExchangeSettlement, refundCustomerStatus } from "./orderAftercare";

const cancelled = {
  orderId: "ord-1",
  cancellationAccepted: true,
  orderCancelled: true,
  requiresRefund: false,
};

describe("order aftercare", () => {
  it("does not promise a refund for an unpaid cancellation", () => {
    expect(cancelOutcome(cancelled).text).toBe("Your order has been cancelled.");
    expect(cancelOutcome({ ...cancelled, paymentStatus: "CANCELLED" } as never).text).not.toMatch(/bank|refund/i);
  });

  it("describes a pending paid refund without calling it settled", () => {
    const text = cancelOutcome({
      ...cancelled,
      requiresRefund: true,
      refund: { refundId: "rf-1", status: "PROCESSING", resultState: "PENDING" },
    }).text;
    expect(text).toMatch(/being processed/i);
    expect(text).toMatch(/does not mean the money has reached your bank/i);
  });

  it("confirms a completed refund only from the refund record", () => {
    const text = cancelOutcome({
      ...cancelled,
      requiresRefund: true,
      refund: { refundId: "rf-1", status: "COMPLETED", resultState: "SUCCEEDED", amount: "100.00", currency: "AED" },
    }).text;
    expect(text).toMatch(/has been completed/);
    expect(text).toMatch(/100.00 AED/);
    expect(text).toMatch(/more time to appear with your bank/);
  });

  it("separates a refund being checked from one our team sends, never as an error", () => {
    const held = cancelOutcome({
      ...cancelled,
      requiresRefund: true,
      requiresManualReview: true,
      refund: { refundId: "rf-1", status: "REQUESTED", resultState: "BLOCKED", blockedCode: "REFUND_APPROVAL_REQUIRED" },
    });
    expect(held).toMatchObject({ tone: "info" });
    expect(held.text).toMatch(/checking your refund before sending it/i);
    expect(held.text).toMatch(/email you when it has been paid/i);
    for (const refund of [
      { status: "MANUAL_REVIEW", blockedCode: "REFUND_EXECUTION_DISABLED" },
      { status: "MANUAL_REVIEW", blockedCode: "UNSUPPORTED_REFUND_TENDER" },
      { status: "FAILED", blockedCode: "PROVIDER_REFUND_FAILED" },
    ]) {
      const outcome = cancelOutcome({ ...cancelled, requiresRefund: true, requiresManualReview: true, refund });
      expect(outcome.tone).toBe("info");
      expect(outcome.text).toMatch(/our team will send your refund/i);
      expect(outcome.text).toMatch(/don't need to do anything/i);
    }
    // No refund record at all: still our team, still calm.
    expect(cancelOutcome({ ...cancelled, requiresRefund: true, requiresManualReview: true }).text).toMatch(
      /our team will send your refund/i,
    );
    expect(
      refundCustomerStatus({
        refundId: "rf-1",
        amount: "10",
        currency: "AED",
        status: "FAILED",
        resultState: null,
        requiresManualReview: false,
        blocked: true,
      }),
    ).toBe("This refund could not be completed.");
  });

  it("names a rejected and a cancelled refund for what they are", () => {
    const base = { refundId: "rf-1", amount: "10", currency: "AED", resultState: null, requiresManualReview: false, blocked: false };
    expect(refundCustomerStatus({ ...base, status: "REJECTED" })).toMatch(/not approved/i);
    expect(refundCustomerStatus({ ...base, status: "CANCELLED" })).toBe("This refund was cancelled.");
  });

  it("reads an exchange difference and replacement order without pricing it", () => {
    expect(
      readExchangeSettlement({
        additionalPayment: { amount: "40.00", paymentUrl: "/checkout/payment/cancel?orderId=rep-1" },
        replacementOrderId: "rep-1",
        replacementOrderNumber: "SW-2",
      }),
    ).toMatchObject({
      additionalAmount: "40.00",
      replacementOrderId: "rep-1",
      paymentHref: "/checkout/payment/cancel?orderId=rep-1",
    });
    expect(
      readExchangeSettlement({ differenceRefund: { amount: "15.00" } })?.refundAmount,
    ).toBe("15.00");
    expect(readExchangeSettlement({ settlement: { equalValue: true } })?.equal).toBe(true);
    expect(readExchangeSettlement({ status: "APPROVED" })).toBeNull();
  });
});

describe("whole-order cancel: completed only when the money went back", () => {
  const paid = { orderId: "ord-1", cancellationAccepted: true, orderCancelled: true, requiresRefund: true };

  it("an accepted refund request (resultState SUCCEEDED) is still being processed", () => {
    const text = cancelOutcome({
      ...paid,
      refund: { refundId: "rf-1", status: "PROCESSING", resultState: "SUCCEEDED", amount: "186.00", currency: "AED" },
    }).text;
    expect(text).toMatch(/being processed/i);
    expect(text).not.toMatch(/has been completed/i);
  });

  it.each(["REFUNDED", "PARTIALLY_REFUNDED", "PROVIDER_SUCCESS", "D365_POSTED"])(
    "refund status %s → completed",
    (status) => {
      const text = cancelOutcome({
        ...paid,
        refund: { refundId: "rf-1", status, resultState: "SUCCEEDED", amount: "186.00", currency: "AED" },
      }).text;
      expect(text).toMatch(/refund of 186.00 AED has been completed/i);
    },
  );
});

describe("cancel some items", () => {
  const partial = {
    orderId: "ord-1",
    cancellationAccepted: true,
    orderCancelled: false,
    partial: true,
    requiresRefund: true,
    refundAmount: "80.00",
    offerAdjustmentAmount: "33.33",
    deliveryChargeAmount: "0.00",
  };

  it("names the refund amount while it is processed", () => {
    const text = cancelItemsOutcome(
      { ...partial, refund: { refundId: "rf-1", status: "PROCESSING", resultState: "SUCCEEDED" } },
      "AED",
    ).text;
    expect(text).toMatch(/selected items have been cancelled/i);
    expect(text).toContain("80.00 AED");
    expect(text).toMatch(/being processed/i);
  });

  it("completed once the refund itself says the money went back", () => {
    const text = cancelItemsOutcome(
      { ...partial, refund: { refundId: "rf-1", status: "PARTIALLY_REFUNDED", resultState: "SUCCEEDED" } },
      "AED",
    ).text;
    expect(text).toMatch(/refund of 80.00 AED has been completed/i);
  });

  it("says why nothing comes back when the kept items lost their offer", () => {
    const outcome = cancelItemsOutcome(
      { ...partial, requiresRefund: false, refundAmount: "0.00", offerAdjustmentAmount: "56.67" },
      "AED",
    );
    expect(outcome.tone).toBe("success");
    expect(outcome.text).toMatch(/no longer qualify/i);
  });

  it("cash on delivery: the lower total is paid on delivery", () => {
    expect(cancelItemsOutcome({ ...partial, requiresRefund: false }, "AED").text).toMatch(/on delivery/i);
  });

  it("a refund held for approval is a review, not a failure", () => {
    const outcome = cancelItemsOutcome(
      {
        ...partial,
        requiresManualReview: true,
        refund: { refundId: "rf-1", status: "REQUESTED", resultState: "BLOCKED", blockedCode: "REFUND_APPROVAL_REQUIRED" },
      },
      "AED",
    );
    expect(outcome.tone).toBe("info");
    expect(outcome.text).toMatch(/checking your refund of 80.00 AED before sending it/i);
  });

  it("a refund our team pays by hand (or that could not start) says so, calmly, with the amount", () => {
    for (const refund of [
      { refundId: null, status: null, resultState: "FAILED", blockedCode: "CANCELLATION_REFUND_START_FAILED" },
      { refundId: "rf-1", status: "MANUAL_REVIEW", resultState: "BLOCKED", blockedCode: "REFUND_EXECUTION_DISABLED" },
    ]) {
      const outcome = cancelItemsOutcome({ ...partial, requiresManualReview: true, refund }, "AED");
      expect(outcome.tone).toBe("info");
      expect(outcome.text).toMatch(/our team will send your refund of 80.00 AED/i);
    }
  });
});
