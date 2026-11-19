import type {
  CustomerRefundPartState,
  CustomerRefundPartType,
  CustomerRefundState,
} from "@/features/account/api/customerOrders.service";
import type { AccountStatusTone } from "@/features/account/components/AccountStatus";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { englishTranslator, type MessageKey, type Translator } from "@/lib/i18n/messages";
import type { OrderRefundView } from "./orderAftercare";

/**
 * Refunds on the account order page: one entry per refund with its customer
 * state and the parts it goes back to (card / gift card / points / cash on
 * delivery). Read defensively: older backends send `status` + `amount` only.
 */
export type CustomerRefundPart = {
  type: CustomerRefundPartType;
  amount: string | null;
  currency: string | null;
  points: string | null;
  cardLast4: string | null;
  giftCardMaskedCode: string | null;
  state: CustomerRefundPartState;
};

export type CustomerRefund = {
  refundId: string | null;
  refundNumber: string | null;
  state: CustomerRefundState;
  requestedAmount: string | null;
  refundedAmount: string | null;
  currency: string | null;
  requestedAt: string | null;
  completedAt: string | null;
  parts: CustomerRefundPart[];
};

const STATES: readonly CustomerRefundState[] = [
  "processing",
  "waiting_for_review",
  "manual_payout",
  "completed",
  "not_approved",
  "cancelled",
];
const PART_TYPES: readonly CustomerRefundPartType[] = [
  "card",
  "gift_card",
  "points",
  "cash_on_delivery",
  "original_order",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const next = String(value).trim();
  return next || null;
}

/** State from an older payload's raw status words. */
function legacyState(row: Record<string, unknown>): CustomerRefundState {
  const words = `${text(row.resultState) ?? ""} ${text(row.status) ?? ""}`.toUpperCase();
  if (row.requiresManualReview === true || /MANUAL_REVIEW/.test(words)) return "waiting_for_review";
  if (/REJECTED/.test(words)) return "not_approved";
  if (/CANCELLED/.test(words)) return "cancelled";
  if (/(COMPLETED|SUCCEEDED|SUCCESS|SETTLED|REFUNDED)/.test(words)) return "completed";
  return "processing";
}

function readPart(raw: unknown, currency: string | null): CustomerRefundPart | null {
  const row = asRecord(raw);
  const type = text(row?.type) as CustomerRefundPartType | null;
  if (!row || !type || !PART_TYPES.includes(type)) return null;
  const last4 = text(row.cardLast4);
  return {
    type,
    amount: text(row.amount),
    currency: text(row.currency) ?? currency,
    points: text(row.points),
    cardLast4: last4 && /^\d{4}$/.test(last4) ? last4 : null,
    giftCardMaskedCode: text(row.giftCardMaskedCode),
    state: row.state === "done" ? "done" : "pending",
  };
}

export function readCustomerRefund(raw: unknown): CustomerRefund | null {
  const row = asRecord(raw);
  if (!row) return null;
  const refundId = text(row.refundId);
  const requestedAmount = text(row.requestedAmount) ?? text(row.amount);
  if (!refundId && !requestedAmount && !text(row.state) && !text(row.status)) return null;
  const currency = text(row.currency);
  const state = text(row.state) as CustomerRefundState | null;
  return {
    refundId,
    refundNumber: text(row.refundNumber),
    state: state && STATES.includes(state) ? state : legacyState(row),
    requestedAmount,
    refundedAmount: text(row.refundedAmount),
    currency,
    requestedAt: text(row.requestedAt),
    completedAt: text(row.completedAt),
    parts: Array.isArray(row.parts)
      ? row.parts.flatMap((part) => {
          const read = readPart(part, currency);
          return read ? [read] : [];
        })
      : [],
  };
}

export function readCustomerRefunds(raw: unknown): CustomerRefund[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const refund = readCustomerRefund(item);
    return refund ? [refund] : [];
  });
}

/** The amount to headline: what came back once completed, else what was asked. */
export function refundHeadlineAmount(refund: CustomerRefund): string | null {
  if (refund.state === "completed" && refund.refundedAmount && Number(refund.refundedAmount) > 0) {
    return refund.refundedAmount;
  }
  return refund.requestedAmount;
}

const STATE_COPY: Record<CustomerRefundState, { label: MessageKey; note: MessageKey; tone: AccountStatusTone }> = {
  processing: { label: "orders.refund.state.processing", note: "orders.refund.processing", tone: "accent" },
  waiting_for_review: { label: "orders.refund.state.waitingForReview", note: "orders.refund.review", tone: "warning" },
  manual_payout: { label: "orders.refund.state.manualPayout", note: "orders.refund.manualPayout", tone: "accent" },
  completed: { label: "orders.refund.state.completed", note: "orders.refund.completed", tone: "success" },
  not_approved: { label: "orders.refund.state.notApproved", note: "orders.refund.notApproved", tone: "danger" },
  cancelled: { label: "orders.refund.state.cancelled", note: "orders.refund.cancelled", tone: "muted" },
};

export function refundStateDisplay(
  state: CustomerRefundState,
  t: Translator = englishTranslator,
  parts: readonly Pick<CustomerRefundPart, "type">[] = [],
): { label: string; note: string; tone: AccountStatusTone } {
  const copy = STATE_COPY[state];
  // Cash on delivery paid by hand: our team gets in touch to arrange it.
  const note =
    state === "manual_payout" && parts.some((part) => part.type === "cash_on_delivery")
      ? "orders.refund.manualPayoutCod"
      : copy.note;
  return { label: t(copy.label), note: t(note), tone: copy.tone };
}

/** "AED 96.00 to your card ending 4242", "500 points", ... */
export function refundPartText(
  part: CustomerRefundPart,
  fallbackCurrency: string,
  t: Translator = englishTranslator,
): string {
  const amount =
    part.amount != null && Number.isFinite(Number(part.amount))
      ? formatMoney(Number(part.amount), part.currency ?? fallbackCurrency)
      : "";
  switch (part.type) {
    case "gift_card":
      return part.giftCardMaskedCode
        ? t("orders.refund.part.giftCard", { amount, code: part.giftCardMaskedCode })
        : t("orders.refund.part.giftCardUnnamed", { amount });
    case "points":
      return part.points && Number.isFinite(Number(part.points))
        ? t("orders.refund.part.points", {
            points: Math.round(Number(part.points)).toLocaleString("en-US"),
          })
        : t("orders.refund.part.pointsValue", { amount });
    case "cash_on_delivery":
      return t("orders.refund.part.cod", { amount });
    case "original_order":
      return t("orders.refund.part.originalOrder", { amount });
    default:
      return part.cardLast4
        ? t("orders.refund.part.card", { amount, last4: part.cardLast4 })
        : t("orders.refund.part.original", { amount });
  }
}

/** The older per-refund shape some views still read (status words + amount). */
export function toOrderRefundView(refund: CustomerRefund): OrderRefundView {
  const status: Record<CustomerRefundState, string> = {
    processing: "PROCESSING",
    waiting_for_review: "MANUAL_REVIEW",
    manual_payout: "MANUAL_PAYOUT",
    completed: "COMPLETED",
    not_approved: "REJECTED",
    cancelled: "CANCELLED",
  };
  return {
    refundId: refund.refundNumber ?? refund.refundId,
    amount: refundHeadlineAmount(refund),
    currency: refund.currency,
    status: status[refund.state],
    resultState: null,
    requiresManualReview: refund.state === "waiting_for_review" || refund.state === "manual_payout",
    blocked: false,
  };
}
