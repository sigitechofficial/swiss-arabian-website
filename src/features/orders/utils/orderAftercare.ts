import type { CancelOrderResponse } from "@/features/account/api/customerOrders.service";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

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

export function refundCustomerStatus(refund: OrderRefundView, t: Translator = englishTranslator): string {
  if (upper(refund.status) === "MANUAL_PAYOUT") return t("orders.refund.manualPayout");
  if (refund.requiresManualReview) return t("orders.refund.review");
  if (refund.blocked) return t("orders.refund.failed");
  const state = `${refund.resultState ?? ""} ${refund.status ?? ""}`.toUpperCase();
  if (/(COMPLETED|SUCCEEDED|SUCCESS|SETTLED)/.test(state)) {
    return t("orders.refund.completed");
  }
  if (/REJECTED/.test(state)) return t("orders.refund.notApproved");
  if (/(FAILED|BLOCKED)/.test(state)) return t("orders.refund.failed");
  if (/CANCELLED/.test(state)) return t("orders.refund.cancelled");
  if (refund.status || refund.resultState) return t("orders.refund.processing");
  return t("orders.refund.recorded");
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

/**
 * Refund statuses that mean the money went back (the backend's monetary-success
 * set, plus older wording). `resultState: SUCCEEDED` only says the refund request
 * was accepted, so it never counts as completed on its own.
 */
const REFUND_MONEY_BACK = /^(REFUNDED|PARTIALLY_REFUNDED|PROVIDER_SUCCESS|D365_POSTED|COMPLETED|SUCCEEDED|SETTLED)$/;

function refundMoneyBack(refund: OrderRefundView | null): boolean {
  return REFUND_MONEY_BACK.test(upper(refund?.status));
}

/** Held for approval: being checked before it is sent. */
function heldForApproval(result: CancelOrderResponse): boolean {
  return result.refund?.blockedCode === "REFUND_APPROVAL_REQUIRED";
}

/**
 * Not sent automatically (payment without automatic refunds, refunds switched
 * off, a provider that declined, or no refund record yet): our team sends it.
 * The customer has nothing to do, so this is never shown as an error.
 */
function paidByOurTeam(result: CancelOrderResponse, refund: OrderRefundView | null): boolean {
  if (!refund) return result.requiresManualReview === true;
  const state = `${refund.resultState ?? ""} ${refund.status ?? ""}`.toUpperCase();
  return refund.blocked || refund.requiresManualReview || /(FAILED|BLOCKED|MANUAL_REVIEW)/.test(state);
}

function refundFromCancel(result: CancelOrderResponse): OrderRefundView | null {
  return readOrderRefund(result.refund);
}

/** Some items cancelled: what happened to the money. */
export function cancelItemsOutcome(
  result: CancelOrderResponse,
  currency: string | null,
  t: Translator = englishTranslator,
): CancelFeedback {
  const drop = Number(result.refundAmount ?? 0);
  if (!result.requiresRefund) {
    if (drop > 0) return { tone: "success", text: t("orders.cancel.itemsCod") };
    return {
      tone: "success",
      text: Number(result.offerAdjustmentAmount ?? 0) > 0 || Number(result.deliveryChargeAmount ?? 0) > 0
        ? t("orders.cancel.itemsNoRefund")
        : t("orders.cancel.itemsCancelled"),
    };
  }
  const amount = `${result.refundAmount}${currency ? ` ${currency}` : ""}`;
  const refund = refundFromCancel(result);
  if (refundMoneyBack(refund)) {
    return { tone: "success", text: t("orders.cancel.itemsRefundDone", { amount }) };
  }
  if (heldForApproval(result)) {
    return { tone: "info", text: t("orders.cancel.itemsRefundReview", { amount }) };
  }
  if (paidByOurTeam(result, refund)) {
    return { tone: "info", text: t("orders.cancel.itemsRefundManual", { amount }) };
  }
  return { tone: "info", text: t("orders.cancel.itemsRefundProcessing", { amount }) };
}

/** Customer copy. A cancelled payment status alone is not a completed refund. */
export function cancelOutcome(result: CancelOrderResponse, t: Translator = englishTranslator): CancelFeedback {
  if (!result.orderCancelled && result.cancellationAccepted) {
    return { tone: "info", text: t("orders.cancel.requested") };
  }
  if (!result.orderCancelled) {
    return { tone: "error", text: t("orders.cancel.notCancelled") };
  }
  if (!result.requiresRefund) {
    return { tone: "success", text: t("orders.cancel.cancelled") };
  }
  const refund = refundFromCancel(result);
  if (refund && refundMoneyBack(refund)) {
    if (!refund.amount) return { tone: "success", text: t("orders.cancel.refundDone") };
    const amount = `${refund.amount}${refund.currency ? ` ${refund.currency}` : ""}`;
    return { tone: "success", text: t("orders.cancel.refundDoneAmount", { amount }) };
  }
  if (heldForApproval(result)) {
    return { tone: "info", text: t("orders.cancel.refundReview") };
  }
  if (paidByOurTeam(result, refund)) {
    return { tone: "info", text: t("orders.cancel.refundManual") };
  }
  return { tone: "info", text: t("orders.cancel.refundProcessing") };
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
