import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

export const REVIEW_PENDING_TOAST =
  "Thank you — our team checks it first, usually within a day.";

export const REVIEW_LIVE_TOAST = "Thank you — your review is live.";

/** Message after saving: live straight away, or waiting for the team. */
export function reviewSavedToast(status: string | null | undefined, t: Translator = englishTranslator): string {
  return status === "APPROVED" ? t("reviewForm.toastLive") : t("reviewForm.toastPending");
}

export const REVIEW_NO_PURCHASE_MESSAGE =
  "You can review products from your delivered orders.";

export const REVIEW_ALREADY_EXISTS_MESSAGE =
  "You already reviewed this product.";

export function reviewWriteErrorMessage(error: unknown, t: Translator = englishTranslator): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return t("reviewForm.already");
    if (error.status === 422) return t("reviewForm.noPurchase");
  }
  return getUserFacingErrorMessage(error);
}
