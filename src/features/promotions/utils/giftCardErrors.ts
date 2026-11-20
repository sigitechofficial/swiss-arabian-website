import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

/** A refused gift card, as the shopper reads it (the server words each code). */
export function giftCardErrorMessage(error: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(error, t("error.giftCard.apply"), t);
}
