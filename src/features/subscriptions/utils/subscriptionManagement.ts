import { getUserFacingErrorMessage, knownErrorMessage } from "@/lib/api/userFacingErrors";
import { ApiClientError } from "@/lib/api/apiError";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import type {
  PaymentRecoveryStatus,
  SubscriptionDetail,
  SubscriptionPaymentMethod,
  SubscriptionPaymentRecovery,
} from "../types/subscription.types";

export function maskedCardLast4(last4: string | null | undefined): string | null {
  const digits = (last4 ?? "").replace(/\D/g, "");
  if (digits.length !== 4) return null;
  return `•••• ${digits}`;
}

const CARD_STATUS: Record<string, MessageKey> = {
  ACTIVE: "subs.card.status.active",
  PENDING_SETUP: "subs.card.status.pending",
  FAILED_VERIFICATION: "subs.card.status.unverified",
  REVOKED: "subs.card.status.removed",
};

export function paymentMethodStatusLabel(status: string, t: Translator = pageTranslator()): string {
  const key = CARD_STATUS[status];
  return key ? t(key) : status;
}

export function paymentMethodSummary(
  card: SubscriptionPaymentMethod | null | undefined,
  t: Translator = pageTranslator(),
): string | null {
  if (!card) return null;
  const last4 = maskedCardLast4(card.last4);
  const brand = card.brand?.trim() || t("subs.card.card");
  const expiry = card.expiryMonth && card.expiryYear ? `${card.expiryMonth}/${card.expiryYear}` : null;
  return [brand, last4, expiry ? t("subs.card.expires", { expiry }) : null, paymentMethodStatusLabel(card.status, t)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * A card change failed. API failures read the server's sentence (it words the
 * SUB_PAYMENT_METHOD_* codes in the page's language); otherwise the fallback.
 */
export function paymentMethodErrorMessage(err: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(err, t("subs.card.updateFailed"), t);
}

export function managementErrorMessage(err: unknown, t: Translator = pageTranslator()): string {
  return getUserFacingErrorMessage(err, t("subs.manage.updateFailed"), t);
}

/** Message key: a retry whose outcome the shop could not confirm. */
export const PAYMENT_RETRY_UNCONFIRMED: MessageKey = "subs.recovery.unconfirmed";

export function recoveryRetryVisible(recovery: SubscriptionPaymentRecovery | null | undefined): boolean {
  if (!recovery?.retryEligible) return false;
  return recovery.status === "FAILED" || recovery.status === "ACTION_REQUIRED";
}

export function recoveryStatusLine(status: PaymentRecoveryStatus, t: Translator = pageTranslator()): string | null {
  if (status === "PROCESSING") return t("subs.recovery.processing");
  if (status === "RECONCILIATION_REQUIRED") return t("subs.recovery.verifying");
  if (status === "ORDER_RECOVERY") return t("subs.recovery.orderInProgress");
  return null;
}

/** The fallback for a retry the server refused without its own sentence, by status. */
function retryFallback(status: number): MessageKey {
  if (status === 401) return "subs.manage.sessionExpired";
  if (status === 403) return "subs.recovery.notAllowed";
  if (status === 404) return "subs.manage.notFound";
  return "subs.recovery.failed";
}

export function paymentRetryError(
  err: unknown,
  t: Translator = pageTranslator(),
): { ambiguous: boolean; message: string } {
  if (err instanceof ApiClientError) {
    if (err.status === 0 || err.status >= 500) {
      return { ambiguous: true, message: t(PAYMENT_RETRY_UNCONFIRMED) };
    }
    return { ambiguous: false, message: knownErrorMessage(err, t) ?? t(retryFallback(err.status)) };
  }
  return { ambiguous: true, message: t(PAYMENT_RETRY_UNCONFIRMED) };
}

export function showSubscriptionManagement(
  detail: Pick<SubscriptionDetail, "status" | "actions" | "renewalChargePending">,
): boolean {
  const actions = detail.actions;
  return Boolean(
    detail.renewalChargePending ||
      detail.status === "PAUSED" ||
      actions?.canPause ||
      actions?.canResume ||
      actions?.canSkip ||
      actions?.canCancel,
  );
}
