import type { CancelOrderResponse } from "@/features/account/api/customerOrders.service";

export type OrderRefundView = {
  refundId: string | null;
  amount: string | null;
  currency: string | null;
  status: string | null;
  resultState: string | null;
  requiresManualReview: boolean;
  blocked: boolean;
};

export type CancelFeedback = {
  tone: "success" | "info" | "error";
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const next = String(value).trim();
  return next || null;
}

function upper(value: unknown): string {
  return text(value)?.toUpperCase() ?? "";
}

export function refundCustomerStatus(refund: OrderRefundView): string {
  if (refund.requiresManualReview) return "This refund needs a review before it can be processed.";
  if (refund.blocked) return "This refund could not be completed.";
  const state = `${refund.resultState ?? ""} ${refund.status ?? ""}`.toUpperCase();
  if (/(COMPLETED|SUCCEEDED|SUCCESS|SETTLED)/.test(state)) {
    return "The refund has been completed. It can take more time to appear with your bank.";
  }
  if (/(FAILED|BLOCKED|REJECTED)/.test(state)) return "This refund could not be completed.";
  if (refund.status || refund.resultState) return "This refund is being processed. The money has not been confirmed in your account.";
  return "A refund has been recorded for this order.";
}

export function readOrderRefund(raw: unknown): OrderRefundView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const status = text(row.status);
  const resultState = text(row.resultState);
  if (!text(row.refundId) && !status && !resultState && row.amount == null) return null;
  const blockedCode = text(row.blockedCode);
  return {
    refundId: text(row.refundId),
    amount: text(row.amount),
    currency: text(row.currency),
    status,
    resultState,
    requiresManualReview: row.requiresManualReview === true || upper(status) === "MANUAL_REVIEW",
    blocked: Boolean(blockedCode) || /(FAILED|BLOCKED)/.test(upper(status)) || /(FAILED|BLOCKED)/.test(upper(resultState)),
  };
}

export function readOrderRefunds(raw: unknown): OrderRefundView[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const refund = readOrderRefund(item);
    return refund ? [refund] : [];
  });
}

function refundFromCancel(result: CancelOrderResponse): OrderRefundView | null {
  return readOrderRefund(result.refund);
}

/** Customer copy. A cancelled payment status alone is not a completed refund. */
export function cancelOutcome(result: CancelOrderResponse): CancelFeedback {
  if (!result.orderCancelled && result.cancellationAccepted) {
    return { tone: "info", text: "We’ve received your cancellation request and will confirm it by email." };
  }
  if (!result.orderCancelled) {
    return { tone: "error", text: "We couldn’t cancel this order. Please contact our customer care team." };
  }
  if (!result.requiresRefund) {
    return { tone: "success", text: "Your order has been cancelled." };
  }
  const refund = refundFromCancel(result);
  if (result.requiresManualReview || refund?.requiresManualReview) {
    return {
      tone: "info",
      text: "Your order has been cancelled. The refund needs a review before it can be processed.",
    };
  }
  if (!refund) {
    return {
      tone: "info",
      text: "Your order has been cancelled. A refund is being processed. This does not mean the money has reached your bank.",
    };
  }
  const state = `${refund.resultState ?? ""} ${refund.status ?? ""}`.toUpperCase();
  if (refund.blocked || /(FAILED|BLOCKED|REJECTED)/.test(state)) {
    return {
      tone: "error",
      text: "Your order has been cancelled. The refund could not be completed automatically.",
    };
  }
  if (/(COMPLETED|SUCCEEDED|SUCCESS|SETTLED)/.test(state)) {
    const amount = refund.amount ? ` of ${refund.amount}${refund.currency ? ` ${refund.currency}` : ""}` : "";
    return {
      tone: "success",
      text: `Your order has been cancelled. The refund${amount} has been completed. It can take more time to appear with your bank.`,
    };
  }
  return {
    tone: "info",
    text: "Your order has been cancelled. A refund is being processed. This does not mean the money has reached your bank.",
  };
}

export type ExchangeSettlementView = {
  additionalAmount: string | null;
  refundAmount: string | null;
  equal: boolean;
  paymentHref: string | null;
  replacementOrderId: string | null;
  replacementOrderNumber: string | null;
};

export function readExchangeSettlement(raw: unknown): ExchangeSettlementView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const settlement = asRecord(row.settlement) ?? asRecord(row.priceDifference) ?? row;
  const additional = asRecord(settlement.additionalPayment) ?? asRecord(row.additionalPayment);
  const difference = asRecord(settlement.differenceRefund) ?? asRecord(row.differenceRefund);
  const replacement = asRecord(row.replacementOrder) ?? asRecord(settlement.replacementOrder);
  const additionalAmount = text(additional?.amount ?? settlement.additionalAmount);
  const refundAmount = text(difference?.amount ?? settlement.refundAmount);
  const equal = settlement.equalValue === true || upper(settlement.direction) === "EQUAL";
  const paymentHref = text(additional?.paymentUrl ?? additional?.checkoutUrl ?? settlement.paymentUrl);
  const replacementOrderId = text(replacement?.orderId ?? row.replacementOrderId);
  const replacementOrderNumber = text(replacement?.orderNumber ?? row.replacementOrderNumber);
  if (!additionalAmount && !refundAmount && !equal && !paymentHref && !replacementOrderId) return null;
  return {
    additionalAmount,
    refundAmount,
    equal,
    paymentHref,
    replacementOrderId,
    replacementOrderNumber,
  };
}
