import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";

export const REVIEW_PENDING_TOAST =
  "Thank you — our team checks it first, usually within a day.";

export const REVIEW_LIVE_TOAST = "Thank you — your review is live.";

/** Message after saving: live straight away, or waiting for the team. */
export function reviewSavedToast(status: string | null | undefined): string {
  return status === "APPROVED" ? REVIEW_LIVE_TOAST : REVIEW_PENDING_TOAST;
}

export const REVIEW_NO_PURCHASE_MESSAGE =
  "You can review products from your delivered orders.";

export const REVIEW_ALREADY_EXISTS_MESSAGE =
  "You already reviewed this product.";

export function reviewWriteErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return REVIEW_ALREADY_EXISTS_MESSAGE;
    if (error.status === 422) return REVIEW_NO_PURCHASE_MESSAGE;
  }
  return getUserFacingErrorMessage(error);
}
