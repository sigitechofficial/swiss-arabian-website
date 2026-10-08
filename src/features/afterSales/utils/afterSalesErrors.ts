import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";

export const RETURN_SUBMITTED_TOAST = "Return request submitted.";
export const EXCHANGE_SUBMITTED_TOAST = "Exchange request submitted.";

export function afterSalesErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 404) return "Not found.";
    if (error.status === 401) return "Please sign in to continue.";
  }
  return getUserFacingErrorMessage(error);
}
