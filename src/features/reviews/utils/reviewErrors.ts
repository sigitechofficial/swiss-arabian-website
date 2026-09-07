import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";

export const REVIEW_PENDING_TOAST =
  "Submitted — visible after approval.";

export const REVIEW_NO_PURCHASE_MESSAGE =
  "You can only review products from your completed orders.";

export const REVIEW_ALREADY_EXISTS_MESSAGE =
  "You already reviewed this product.";

export function reviewWriteErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) return REVIEW_ALREADY_EXISTS_MESSAGE;
    if (error.status === 422) return REVIEW_NO_PURCHASE_MESSAGE;
  }
  return getUserFacingErrorMessage(error);
}
