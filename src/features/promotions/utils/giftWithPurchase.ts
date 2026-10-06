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

export function giftAwardCode(award: PromotionGiftAward): string {
  return award.promotionCode?.trim() || "gift";
}

/** The customer still has to pick. A chosen gift is an awarded line. */
export function awaitingGiftChoice(award: PromotionGiftAward): boolean {
  if (giftNotice(award)) return false;
  const choice =
    award.selectionMode === "CUSTOMER_CHOICE" || award.type.includes("CUSTOMER_CHOICE");
  return choice && award.giftItems.length === 0 && award.choices.length > 0;
}

export function isCustomerChoice(award: PromotionGiftAward): boolean {
  return awaitingGiftChoice(award);
}

export function canChangeGift(award: PromotionGiftAward): boolean {
  return (
    award.selectionMode === "CUSTOMER_CHOICE" &&
    award.giftItems.length > 0 &&
    award.choices.length > 0
  );
}

const SEEN_KEY = "sa-gift-reveal-seen";

export function readGiftRevealSeen(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function writeGiftRevealSeen(seen: Set<string>): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

/**
 * Opens the gift modal the first time a choice becomes available on the cart
 * or in the open bag. A refresh in the same tab does not play it again.
 * Losing the offer clears that memory so the next qualification can.
 */
export function nextGiftReveal(input: {
  awaitingCodes: string[];
  awardedCodes: string[];
  seen: Set<string>;
  surfaceVisible: boolean;
  alreadyOpen: boolean;
}): { openCode: string | null } {
  for (const code of [...input.seen]) {
    if (!input.awaitingCodes.includes(code) && !input.awardedCodes.includes(code)) {
      input.seen.delete(code);
    }
  }
  if (input.alreadyOpen || !input.surfaceVisible) return { openCode: null };
  const fresh = input.awaitingCodes.find((code) => !input.seen.has(code)) ?? null;
  if (!fresh) return { openCode: null };
  input.seen.add(fresh);
  return { openCode: fresh };
}

/** Awarded lines only. Choice lists and removal notices are not priced lines. */
export function awardedGiftLines(snapshot: unknown): PromotionGiftLine[] {
  return readGiftAwards(snapshot).flatMap((award) => {
    if (giftNotice(award) || isCustomerChoice(award)) return [];
    return award.giftItems;
  });
}

export function giftDisplayName(line: PromotionGiftLine): string {
  const name = line.name?.trim();
  if (name && !name.includes(":")) return name;
  if (line.sku.includes(":")) return "Free gift";
  return name || line.sku;
}

/** Server gifts are free. This does not adjust cart totals. */
export function giftUnitPrice(): number {
  return 0;
}
