import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

/** Refused reward points, as the shopper reads it (the server words each reason code). */
export function loyaltyRedemptionErrorMessage(error: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(error, t("error.loyalty.apply"), t);
}
