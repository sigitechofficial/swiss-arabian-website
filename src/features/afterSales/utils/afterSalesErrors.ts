import { ApiClientError } from "@/lib/api/apiError";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { englishTranslator, type Translator } from "@/lib/i18n/messages";

export const RETURN_SUBMITTED_TOAST = "Return request submitted.";
export const EXCHANGE_SUBMITTED_TOAST = "Exchange request submitted.";

/** The market makes the free gift come back with a full return (giftOnReturn = MUST_RETURN). */
export const RETURN_GIFT_REQUIRED = "RETURN_GIFT_REQUIRED";

export function isGiftRequiredError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === RETURN_GIFT_REQUIRED;
}

/** A free gift can only be exchanged for the same item (platform rule). */
export const EXCHANGE_GIFT_SAME_ITEM_ONLY = "EXCHANGE_GIFT_SAME_ITEM_ONLY";

/** The replacement is not the same item or another size of it sold in this market. */
export const EXCHANGE_REPLACEMENT_NOT_OFFERED = "EXCHANGE_REPLACEMENT_NOT_OFFERED";

export function afterSalesErrorMessage(error: unknown, t: Translator = englishTranslator): string {
  if (isGiftRequiredError(error)) return t("afterSales.err.giftRequired");
  if (error instanceof ApiClientError && error.code === EXCHANGE_GIFT_SAME_ITEM_ONLY) {
    return t("afterSales.err.giftSameItemOnly");
  }
  if (error instanceof ApiClientError && error.code === EXCHANGE_REPLACEMENT_NOT_OFFERED) {
    return t("afterSales.err.replacementNotOffered");
  }
  if (error instanceof ApiClientError) {
    if (error.status === 404) return t("afterSales.err.notFound");
    if (error.status === 401) return t("afterSales.err.signIn");
  }
  return getUserFacingErrorMessage(error);
}
