import { getUserFacingErrorMessage, knownErrorMessage } from "@/lib/api/userFacingErrors";
import { ApiClientError } from "@/lib/api/apiError";
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

export function paymentMethodStatusLabel(status: string): string {
  if (status === "ACTIVE") return "Active";
  if (status === "PENDING_SETUP") return "Pending";
  if (status === "FAILED_VERIFICATION") return "Not verified";
  if (status === "REVOKED") return "Removed";
  return status;
}

export function paymentMethodSummary(card: SubscriptionPaymentMethod | null | undefined): string | null {
  if (!card) return null;
  const last4 = maskedCardLast4(card.last4);
  const brand = card.brand?.trim() || "Card";
  const expiry = card.expiryMonth && card.expiryYear ? `${card.expiryMonth}/${card.expiryYear}` : null;
  return [brand, last4, expiry ? `Expires ${expiry}` : null, paymentMethodStatusLabel(card.status)]
    .filter(Boolean)
    .join(" · ");
}

export function paymentMethodErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    const said = knownErrorMessage(err);
    if (said) return said;
    if (err.status === 401) return "Your session has expired. Sign in again.";
    if (err.status === 404) return "This subscription could not be found.";
    if (err.code === "SUB_PAYMENT_METHOD_RENEWAL_PENDING") {
      return "A renewal charge is already in progress for this subscription.";
    }
    if (err.code === "SUB_PAYMENT_METHOD_UNVERIFIED") {
      return "The card setup was not verified. The saved card is unchanged.";
    }
    if (err.code === "SUB_PAYMENT_METHOD_MARKET") {
      return "This card is not saved for this market. The saved card is unchanged.";
    }
  }
  return getUserFacingErrorMessage(err, "The card could not be updated. Check your connection and try again.");
}

export function managementErrorMessage(err: unknown): string {
  return getUserFacingErrorMessage(err, "The subscription could not be updated. Check your connection and try again.");
}

export const PAYMENT_RETRY_UNCONFIRMED =
  "We could not confirm whether this retry was received. The subscription has been refreshed. Retry again only if it is still offered.";

export function recoveryRetryVisible(recovery: SubscriptionPaymentRecovery | null | undefined): boolean {
  if (!recovery?.retryEligible) return false;
  return recovery.status === "FAILED" || recovery.status === "ACTION_REQUIRED";
}

export function recoveryStatusLine(status: PaymentRecoveryStatus): string | null {
  if (status === "PROCESSING") return "Payment processing.";
  if (status === "RECONCILIATION_REQUIRED") return "Payment verification pending.";
  if (status === "ORDER_RECOVERY") return "Payment received — Order confirmation in progress.";
  return null;
}

export function paymentRetryError(err: unknown): { ambiguous: boolean; message: string } {
  if (err instanceof ApiClientError) {
    if (err.status === 0 || err.status >= 500) {
      return { ambiguous: true, message: PAYMENT_RETRY_UNCONFIRMED };
    }
    if (err.status === 401) {
      return { ambiguous: false, message: knownErrorMessage(err) ?? "Your session has expired. Sign in again." };
    }
    if (err.status === 403) {
      return { ambiguous: false, message: knownErrorMessage(err) ?? "You cannot retry this subscription payment." };
    }
    if (err.status === 404) {
      return { ambiguous: false, message: knownErrorMessage(err) ?? "This subscription could not be found." };
    }
    return { ambiguous: false, message: knownErrorMessage(err) ?? "This payment could not be retried." };
  }
  return { ambiguous: true, message: PAYMENT_RETRY_UNCONFIRMED };
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
