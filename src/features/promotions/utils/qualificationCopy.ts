import { formatMoney } from "@/features/home/utils/formatMoney";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type { PromotionOffer } from "../types/promotions";
import { structuredSpendAmount, unlockThresholdAmount } from "./freeShippingThreshold";


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

function spendToUnlock(amount: string, currency: string, label: string, t: Translator): string {
  return t("promotions.qualify.spendToUnlock", { amount: formatMoney(Number(amount), currency), offer: label });
}

/**
 * Informational qualification copy. Applied state comes only from `promotions.applied`.
 * Returns null when there is nothing safe to say.
 */
export function offerQualificationMessage(
  offer: PromotionOffer,
  currency = "AED",
  options?: { shippingApplied?: boolean },
  t: Translator = pageTranslator(),
): string | null {
  const status = offer.qualification?.status;
  if (status === "ELIGIBLE") return null;

  const reason = offer.rejected?.reason ?? null;
  const pendingReason = offer.qualification?.pendingReason ?? null;

  if (status === "PENDING" || reason === "PAYMENT_METHOD_REQUIRED" || reason === "SHIPPING_METHOD_REQUIRED") {
    const pending = pendingReason ?? reason;
    if (pending === "PAYMENT_METHOD_REQUIRED") return t("promotions.qualify.paymentPending");
    if (pending === "SHIPPING_METHOD_REQUIRED") return t("promotions.qualify.shippingPending");
    return null;
  }

  if (reason === "MIN_ELIGIBLE_SUBTOTAL") {
    const backend = safeBackendMessage(offer.rejected?.message, reason);
    if (backend) return backend;
    const remaining =
      trimmed(offer.qualification?.remainingAmount) ?? trimmed(offer.rejected?.remainingAmount);
    if (remaining) return spendToUnlock(remaining, currency, t("promotions.qualify.thisOffer"), t);
    return t("promotions.qualify.moreEligible");
  }

  if (reason === "MIN_ORDER_QUANTITY") {
    return t("promotions.qualify.moreItems");
  }

  if (reason === "MIN_ELIGIBLE_QUANTITY") {
    return t("promotions.qualify.moreEligible");
  }

  if (reason === "REQUIRED_PRODUCT_MISSING") {
    return t("promotions.qualify.requiredItem");
  }

  if (
    reason === "LOYALTY_NOT_AVAILABLE" ||
    reason === "LOYALTY_TIER_REQUIRED" ||
    reason === "LOYALTY_TIER_MISMATCH" ||
    reason === "LOYALTY_MEMBER_REQUIRED" ||
    reason === "CUSTOMER_TIER" ||
    reason === "REQUIRED_TIER"
  ) {
    return (
      safeBackendMessage(offer.rejected?.message, reason) ??
      t("promotions.qualify.rewardsStatus")
    );
  }

  if (reason === "MIN_ORDER" || offer.qualification?.remainingAmount || offer.qualification?.minOrderAmount) {
    const remaining =
      trimmed(offer.qualification?.remainingAmount) ?? trimmed(offer.rejected?.remainingAmount);
    const title = trimmed(offer.title) ?? trimmed(offer.label);
    if (remaining) {
      // No title: the offer is free shipping, already unlocked when shipping is applied.
      if (!title && options?.shippingApplied) return null;
      return spendToUnlock(remaining, currency, title ?? t("promotions.qualify.freeShipping"), t);
    }
    const threshold = unlockThresholdAmount(offer) ?? structuredSpendAmount(offer);
    if (threshold) return spendToUnlock(threshold, currency, title ?? t("promotions.qualify.thisOffer"), t);
  }

  return null;
}
