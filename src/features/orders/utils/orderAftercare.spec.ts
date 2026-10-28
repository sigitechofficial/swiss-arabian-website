import { describe, expect, it } from "vitest";
import { cancelOutcome, readExchangeSettlement, readOrderRefunds, refundCustomerStatus } from "./orderAftercare";

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

  it("separates manual review and a blocked refund", () => {
    expect(
      cancelOutcome({ ...cancelled, requiresRefund: true, requiresManualReview: true }).text,
    ).toMatch(/needs a review/i);
    expect(
      cancelOutcome({
        ...cancelled,
        requiresRefund: true,
        refund: { status: "FAILED", blockedCode: "REFUND_EXECUTION_DISABLED" },
      }).text,
    ).toMatch(/could not be completed/i);
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

  it("reads refund history without requiring every field", () => {
    expect(readOrderRefunds([{ refundId: "rf-9", amount: "25.00", status: "PROCESSING" }])).toEqual([
      expect.objectContaining({ refundId: "rf-9", amount: "25.00", requiresManualReview: false }),
    ]);
    expect(readOrderRefunds(undefined)).toEqual([]);
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
