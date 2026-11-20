import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

/** Message after saving: live straight away, or waiting for the team. */
export function reviewSavedToast(status: string | null | undefined, t: Translator = englishTranslator): string {
  return status === "APPROVED" ? t("reviewForm.toastLive") : t("reviewForm.toastPending");
}

/**
 * A refused review, as the shopper reads it. The server words each refusal
 * (already reviewed, not from a delivered order…) in the page's language.
 */
export function reviewWriteErrorMessage(error: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(error, undefined, t);
}
