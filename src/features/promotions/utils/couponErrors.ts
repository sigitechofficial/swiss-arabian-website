import { ApiClientError } from "@/lib/api/apiError";
import { formatMoney } from "@/lib/format/money";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function couponErrorContext(error: unknown): Record<string, unknown> {
  if (!(error instanceof ApiClientError)) return {};
  return asRecord(error.context) ?? asRecord(error.details) ?? asRecord(error.data) ?? {};
}

/** The code needs a bigger bag: the shop says by how much (the server's facts). */
function spendMoreMessage(error: ApiClientError, currency: string, t: Translator): string | null {
  if (error.code !== "COUPON_NOT_APPLICABLE_MIN_ORDER") return null;
  const ctx = couponErrorContext(error);
  const amount = [ctx.remainingAmount, ctx.minOrderAmount]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean);
  return amount ? t("error.coupon.spendMore", { amount: formatMoney(Number(amount), currency) }) : null;
}

/** A refused offer code, as the shopper reads it. */
export function couponErrorMessage(
  error: unknown,
  currency = "AED",
  t: Translator = pageTranslator(),
): string {
  if (error instanceof ApiClientError) {
    const spendMore = spendMoreMessage(error, currency, t);
    if (spendMore) return spendMore;
  }
  return getUserFacingErrorMessage(error, t("error.coupon.apply"), t);
}
