import { initiatePayment } from "../api/orders.service";
import {
  getPayAttempt,
  storePaymentTransactionId,
  storeStripeClientSecret,
  storeStripePublishableKey,
} from "./checkoutSession";

export type PaymentStartResult =
  | { kind: "redirect" }
  | { kind: "inline" }
  | { kind: "confirmation" };

/**
 * Start (or restart) payment for a placed order and route the shopper to the
 * next step. Shared by checkout submit and the retry screen so both handle
 * every provider the same way — the reference's retry only knew about Paymob.
 */
export async function startPayment(
  orderId: string,
  navigate: (href: string) => void,
  method: { zonePaymentMethodId?: string | null; paymentMethodId?: string | null } = {},
): Promise<PaymentStartResult> {
  const origin = window.location.origin;

  const payment = await initiatePayment(orderId, {
    idempotencyKey: `pay-${orderId}-${getPayAttempt()}`,
    returnUrl: `${origin}/checkout/payment/success`,
    // Kept free of query params: gateways append their own and a pre-existing
    // `?` risks a malformed return URL. The page recovers the order from storage.
    cancelUrl: `${origin}/checkout/payment/cancel`,
    ...(method.zonePaymentMethodId ? { zonePaymentMethodId: method.zonePaymentMethodId } : {}),
    ...(method.paymentMethodId ? { paymentMethodId: method.paymentMethodId } : {}),
  });

  if (payment.paymentTransactionId) storePaymentTransactionId(payment.paymentTransactionId);
  if (payment.warnings?.length) {
    // Provider config notes — for logs only, never shown to shoppers.
    console.warn("[checkout] payment provider warnings", payment.warnings);
  }

  if (payment.paymentAction === "REDIRECT" && payment.redirectUrl) {
    // Hosted gateway on another origin — a hard navigation, not a client route.
    window.location.assign(payment.redirectUrl);
    return { kind: "redirect" };
  }

  const meta = payment.metadata ?? {};
  const clientSecret =
    payment.clientSecret ?? (typeof meta.clientSecret === "string" ? meta.clientSecret : null);
  const publishableKey =
    typeof meta.publishableKey === "string"
      ? meta.publishableKey
      : typeof meta.publishable_key === "string"
        ? meta.publishable_key
        : null;

  if (payment.paymentAction === "INLINE_CARD" && clientSecret && publishableKey) {
    storeStripeClientSecret(clientSecret);
    storeStripePublishableKey(publishableKey);
    navigate("/checkout/payment/stripe");
    return { kind: "inline" };
  }

  // No gateway step, or the provider isn't executing on this environment
  // (PENDING_PROVIDER_EXECUTION). The order exists either way, so show it — the
  // confirmation page reports the payment as pending and offers to retry.
  navigate(`/order-confirmation/${orderId}`);
  return { kind: "confirmation" };
}
