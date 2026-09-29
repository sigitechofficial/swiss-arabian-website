import type { PromotionOffer } from "../types/promotions";

function trimmed(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

/**
 * Legacy threshold from pre-P6 fields.
 * Campaign codes and titles are not parsed.
 */
export function explicitThresholdAmount(offer: PromotionOffer): string | null {
  return (
    trimmed(offer.eligibility?.thresholdAmount) ??
    trimmed(offer.thresholdAmount) ??
    trimmed(offer.rejected?.thresholdAmount)
  );
}

/**
 * Server spend figure.
 * Remaining amount wins over the threshold. The client does not subtract.
 */
export function structuredSpendAmount(offer: PromotionOffer): string | null {
  return (
    trimmed(offer.qualification?.remainingAmount) ??
    trimmed(offer.qualification?.minOrderAmount) ??
    trimmed(offer.rejected?.remainingAmount) ??
    trimmed(offer.rejected?.minOrderAmount) ??
    null
  );
}

/** Amount for a MIN_ORDER miss. Pending and eligible offers are not near-misses. */
export function unlockThresholdAmount(offer: PromotionOffer): string | null {
  const status = offer.qualification?.status;
  if (status === "PENDING" || status === "ELIGIBLE") return null;
  if (offer.rejected?.reason && offer.rejected.reason !== "MIN_ORDER") return null;
  return structuredSpendAmount(offer) ?? explicitThresholdAmount(offer);
}
