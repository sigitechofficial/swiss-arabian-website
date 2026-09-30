import {
  readGiftAwards,
  type PromotionGiftAward,
  type PromotionGiftLine,
} from "../types/promotions";

const REMOVED = new Set(["REMOVED", "GIFT_REMOVED"]);
const UNAVAILABLE = new Set(["UNAVAILABLE", "GIFT_UNAVAILABLE"]);
const INELIGIBLE = new Set([
  "INELIGIBLE",
  "NO_LONGER_QUALIFIES",
  "PROMOTION_INELIGIBLE",
  "GIFT_INELIGIBLE",
]);

export function giftNotice(award: PromotionGiftAward): string | null {
  const status = award.status?.trim().toUpperCase() ?? "";
  if (REMOVED.has(status)) return award.message?.trim() || "This free gift was removed.";
  if (UNAVAILABLE.has(status)) return award.message?.trim() || "This free gift is unavailable.";
  if (INELIGIBLE.has(status)) {
    return award.message?.trim() || "This offer no longer includes a free gift.";
  }
  return null;
}

export function giftErrorMessage(code: string | null | undefined, fallback?: string | null): string {
  switch (code) {
    case "GIFT_UNAVAILABLE":
      return "This free gift is unavailable.";
    case "GIFT_REMOVED":
      return "This free gift was removed.";
    case "PROMOTION_INELIGIBLE":
    case "GIFT_INELIGIBLE":
    case "NO_LONGER_QUALIFIES":
      return "This offer no longer includes a free gift.";
    default:
      return fallback?.trim() || "We couldn’t update your free gift. Please try again.";
  }
}

export function isCustomerChoice(award: PromotionGiftAward): boolean {
  return award.type.includes("CUSTOMER_CHOICE");
}

/** Awarded lines only. Choice lists and removal notices are not priced lines. */
export function awardedGiftLines(snapshot: unknown): PromotionGiftLine[] {
  return readGiftAwards(snapshot).flatMap((award) => {
    if (giftNotice(award) || isCustomerChoice(award)) return [];
    return award.giftItems;
  });
}

export function giftDisplayName(line: PromotionGiftLine): string {
  return line.name?.trim() || line.sku;
}

/** Server gifts are free. This does not adjust cart totals. */
export function giftUnitPrice(): number {
  return 0;
}
