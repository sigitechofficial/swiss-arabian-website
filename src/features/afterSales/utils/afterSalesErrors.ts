import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

/**
 * A refused return or exchange, as the shopper reads it. The server words every
 * refusal (free gift required, gift same item only, replacement not offered,
 * window closed…) in the page's language.
 */
export function afterSalesErrorMessage(error: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(error, undefined, t);
}
