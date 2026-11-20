import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type { PromotionRejected } from "../types/promotions";

/** Message key: quiet copy when the server sends a conflict without a message. */
export const CONFLICT_FALLBACK: MessageKey = "promotions.conflict.fallback";

/** Distinct informational notes. Identical sentences are shown once. */
export function promotionConflictNotes(
  rejected: PromotionRejected[] | null | undefined,
  t: Translator = pageTranslator(),
): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const item of rejected ?? []) {
    if (item.reason !== "PROMOTION_CONFLICT") continue;
    const text = item.message?.trim() || t(CONFLICT_FALLBACK);
    if (seen.has(text)) continue;
    seen.add(text);
    notes.push(text);
  }
  return notes;
}
