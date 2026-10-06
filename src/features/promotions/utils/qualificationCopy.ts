import { formatMoney } from "@/features/home/utils/formatMoney";
import type { PromotionOffer } from "../types/promotions";
import { structuredSpendAmount, unlockThresholdAmount } from "./freeShippingThreshold";

const PAYMENT_PENDING =
  "Select an eligible payment method at checkout to use this offer.";
const SHIPPING_PENDING =
  "Select an eligible delivery method at checkout to use this offer.";

function trimmed(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

/** Customer copy only. Reason codes and snake-case tokens are not shown. */
function safeBackendMessage(message: string | null | undefined, reason: string): string | null {
  const text = trimmed(message);
  if (!text || text === reason) return null;
  if (/^[A-Z0-9_]+$/.test(text)) return null;
  return text;
}

function spendToUnlock(amount: string, currency: string, label: string): string {
  return `Spend ${formatMoney(Number(amount), currency)} to unlock ${label}.`;
}

/**
 * Informational qualification copy. Applied state comes only from `promotions.applied`.
 * Returns null when there is nothing safe to say.
 */
export function offerQualificationMessage(
  offer: PromotionOffer,
  currency = "AED",
  options?: { shippingApplied?: boolean },
): string | null {
  const status = offer.qualification?.status;
  if (status === "ELIGIBLE") return null;

  const reason = offer.rejected?.reason ?? null;
  const pendingReason = offer.qualification?.pendingReason ?? null;

  if (status === "PENDING" || reason === "PAYMENT_METHOD_REQUIRED" || reason === "SHIPPING_METHOD_REQUIRED") {
    const pending = pendingReason ?? reason;
    if (pending === "PAYMENT_METHOD_REQUIRED") return PAYMENT_PENDING;
    if (pending === "SHIPPING_METHOD_REQUIRED") return SHIPPING_PENDING;
    return null;
  }

  if (reason === "MIN_ELIGIBLE_SUBTOTAL") {
    const backend = safeBackendMessage(offer.rejected?.message, reason);
    if (backend) return backend;
    const remaining =
      trimmed(offer.qualification?.remainingAmount) ?? trimmed(offer.rejected?.remainingAmount);
    if (remaining) return spendToUnlock(remaining, currency, "this offer");
    return "Add more eligible items to unlock this offer.";
  }

  if (reason === "MIN_ORDER_QUANTITY") {
    return "Add more items to unlock this offer.";
  }

  if (reason === "MIN_ELIGIBLE_QUANTITY") {
    return "Add more eligible items to unlock this offer.";
  }

  if (reason === "REQUIRED_PRODUCT_MISSING") {
    return "Add the required item to use this offer.";
  }

  if (reason === "MIN_ORDER" || offer.qualification?.remainingAmount || offer.qualification?.minOrderAmount) {
    const remaining =
      trimmed(offer.qualification?.remainingAmount) ?? trimmed(offer.rejected?.remainingAmount);
    const title = trimmed(offer.title) ?? trimmed(offer.label);
    if (remaining) {
      const label = title ?? "free shipping";
      if (options?.shippingApplied && label === "free shipping") return null;
      return spendToUnlock(remaining, currency, label);
    }
    const threshold = unlockThresholdAmount(offer) ?? structuredSpendAmount(offer);
    if (threshold) return spendToUnlock(threshold, currency, title ?? "this offer");
  }

  return null;
}
