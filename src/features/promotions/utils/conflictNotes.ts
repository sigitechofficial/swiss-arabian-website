import type { PromotionRejected } from "../types/promotions";

/** Established quiet copy when the server sends a conflict without a message. */
export const CONFLICT_FALLBACK =
  "Another offer didn’t combine with the one already on your bag.";

/** Distinct informational notes. Identical sentences are shown once. */
export function promotionConflictNotes(
  rejected: PromotionRejected[] | null | undefined,
): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const item of rejected ?? []) {
    if (item.reason !== "PROMOTION_CONFLICT") continue;
    const text = item.message?.trim() || CONFLICT_FALLBACK;
    if (seen.has(text)) continue;
    seen.add(text);
    notes.push(text);
  }
  return notes;
}
