import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

export const RETURN_SUBMITTED_TOAST = "Return request submitted.";
export const EXCHANGE_SUBMITTED_TOAST = "Exchange request submitted.";

export function afterSalesErrorMessage(error: unknown, t: Translator = englishTranslator): string {
  if (error instanceof ApiClientError) {
    if (error.status === 404) return t("afterSales.err.notFound");
    if (error.status === 401) return t("afterSales.err.signIn");
  }
  return getUserFacingErrorMessage(error);
}
