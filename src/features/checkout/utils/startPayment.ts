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
 * The gateway couldn't produce a payment page (e.g. Paymob returned no
 * `redirectUrl`, usually with a provider warning). The order still exists —
 * callers send the shopper to the retry screen, never to confirmation.
 */
export class PaymentGatewayError extends Error {
  readonly warnings: string[];

  constructor(warnings: string[] = []) {
    super("The payment gateway couldn’t start this payment.");
    this.name = "PaymentGatewayError";
    this.warnings = warnings;
  }
}

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
    // Retries bump the attempt (`pay-<orderId>-2`…): a gateway session is single-use.
    idempotencyKey: `pay-${orderId}-${getPayAttempt()}`,
    // Paymob sends the browser here after 3DS. It must carry the REAL order
    // UUID — the gateway substitutes no placeholders. Landing here is UX only:
    // the confirmation page polls payment-status, and the webhook decides.
    // No query params: gateways append their own.
    returnUrl: `${origin}/order-confirmation/${encodeURIComponent(orderId)}`,
    // Our retry screen rather than `/checkout`: the order already consumed the
    // bag, so checkout would be empty. The order stays payable from there.
    cancelUrl: `${origin}/checkout/payment/cancel`,
    ...(method.zonePaymentMethodId ? { zonePaymentMethodId: method.zonePaymentMethodId } : {}),
    ...(method.paymentMethodId ? { paymentMethodId: method.paymentMethodId } : {}),
  });

  if (payment.paymentTransactionId) storePaymentTransactionId(payment.paymentTransactionId);
  if (payment.warnings?.length) {
    // Provider config notes — for logs only, never shown to shoppers.
    console.warn("[checkout] payment provider warnings", payment.warnings);
  }

  const provider = `${payment.providerCode ?? ""} ${payment.paymentMethod?.providerCode ?? ""}`;
  const isHostedGateway = payment.paymentAction === "REDIRECT" || /paymob/i.test(provider);

  if (isHostedGateway) {
    if (!payment.redirectUrl) {
      // No payment page to send them to — surface an error; never fall through
      // to the confirmation page as if the order were paid.
      throw new PaymentGatewayError(payment.warnings ?? []);
    }
    // Hosted gateway on another origin — a hard navigation, not a client route.
    // The order id is already in storage for the return trip.
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
