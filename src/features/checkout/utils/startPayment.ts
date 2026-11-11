import { initiatePayment } from "../api/orders.service";
import {
  getPayAttempt,
  storePaymentTransactionId,
  storePaymobClientSecret,
  storePaymobPublicKey,
  storeStripeClientSecret,
  storeStripePublishableKey,
} from "./checkoutSession";
import { tabbyRejectionFrom, type TabbyMessage } from "./tabby";

export type PaymentStartResult =
  | { kind: "redirect" }
  | { kind: "inline"; inline?: InlinePaymentSession }
  | { kind: "confirmation" };

export type InlinePaymentSession = {
  provider: "stripe" | "paymob";
  orderId: string;
  clientSecret: string;
  publishableKey?: string;
  publicKey?: string;
};

/**
 * The gateway couldn't produce a payment session (no Paymob client secret,
 * no Stripe key, or a hosted gateway with no `redirectUrl`). The order still exists —
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
 * The provider declined to offer this payment (Tabby said no). Not a fault:
 * the order is saved and the shopper picks another method. `messages` is the
 * provider's own wording.
 */
export class PaymentRejectedError extends Error {
  readonly provider: "tabby";
  readonly messages: TabbyMessage;

  constructor(provider: "tabby", messages: TabbyMessage) {
    super(messages.en);
    this.name = "PaymentRejectedError";
    this.provider = provider;
    this.messages = messages;
  }
}

/**
 * Start (or restart) payment for a placed order and route the shopper to the
 * next step. Shared by checkout submit and the retry screen so both handle
 * every provider the same way — the reference's retry only knew about Paymob.
 */
export type PreparedInlinePayment = {
  provider: "paymob" | "stripe";
  correlationId: string;
  clientSecret: string;
  publicKey?: string;
  publishableKey?: string;
  providerReference?: string | null;
};

export async function startPayment(
  orderId: string,
  navigate: (href: string) => void,
  method: {
    zonePaymentMethodId?: string | null;
    paymentMethodId?: string | null;
    /** Used to pick Telr / Tabby return URLs before initiate responds. */
    providerCode?: string | null;
  } = {},
  options: { inline?: boolean; prepared?: PreparedInlinePayment | null } = {},
): Promise<PaymentStartResult> {
  const origin = window.location.origin;
  const prepared = options.prepared;
  const hintProvider = (method.providerCode ?? "").toLowerCase();
  const isTelrHint = hintProvider.includes("telr");
  const isTabbyHint = hintProvider.includes("tabby");
  // BE Telr contract: `/payments/telr/return` (not order-confirmation).
  // BE Tabby contract: `/payments/tabby/return` for success and cancel — the
  // backend adds `result=success|cancel` and builds the failure URL itself.
  // Shared Stripe/Paymob keep the existing confirmation return.
  const returnUrl = isTelrHint
    ? `${origin}/payments/telr/return`
    : isTabbyHint
      ? `${origin}/payments/tabby/return`
      : `${origin}/order-confirmation/${encodeURIComponent(orderId)}`;
  const cancelUrl = isTelrHint
    ? `${origin}/payments/telr/return?result=cancelled`
    : isTabbyHint
      ? `${origin}/payments/tabby/return`
      : `${origin}/checkout/payment/cancel`;

  const payment = await initiatePayment(orderId, {
    idempotencyKey: prepared?.correlationId ?? `pay-${orderId}-${getPayAttempt()}`,
    returnUrl,
    cancelUrl,
    ...(method.zonePaymentMethodId ? { zonePaymentMethodId: method.zonePaymentMethodId } : {}),
    ...(method.paymentMethodId ? { paymentMethodId: method.paymentMethodId } : {}),
    ...(prepared
      ? {
          metadata: {
            preparedClientSecret: prepared.clientSecret,
            preparedProvider: prepared.provider,
            ...(prepared.publicKey ? { preparedPublicKey: prepared.publicKey } : {}),
            ...(prepared.publishableKey ? { preparedPublishableKey: prepared.publishableKey } : {}),
            ...(prepared.providerReference ? { preparedProviderReference: prepared.providerReference } : {}),
          },
        }
      : {}),
  });

  if (payment.paymentTransactionId) storePaymentTransactionId(payment.paymentTransactionId);
  if (payment.warnings?.length) {
    // Provider config notes — for logs only, never shown to shoppers.
    console.warn("[checkout] payment provider warnings", payment.warnings);
  }

  const provider = `${payment.providerCode ?? ""} ${payment.paymentMethod?.providerCode ?? ""}`.toLowerCase();
  const isPaymob = provider.includes("paymob");
  const isTelr = provider.includes("telr") || isTelrHint;
  const isTabby = provider.includes("tabby") || isTabbyHint;
  if (isTabby) {
    // Tabby declined before any redirect — show their message, keep the order.
    const rejection = tabbyRejectionFrom(payment.metadata as Record<string, unknown> | null | undefined);
    if (rejection) throw new PaymentRejectedError("tabby", rejection);
  }
  if (provider.includes("smoke")) {
    window.location.replace(`/order-confirmation/${orderId}`);
    return { kind: "confirmation" };
  }
  const meta = payment.metadata ?? {};
  const clientSecret =
    payment.clientSecret ?? (typeof meta.clientSecret === "string" ? meta.clientSecret : null);
  const paymobPublicKey = typeof meta.publicKey === "string" ? meta.publicKey : null;
  const publishableKey =
    typeof meta.publishableKey === "string"
      ? meta.publishableKey
      : typeof meta.publishable_key === "string"
        ? meta.publishable_key
        : null;

  if (payment.paymentAction === "INLINE_CARD" && clientSecret && isPaymob && paymobPublicKey) {
    storePaymobClientSecret(clientSecret);
    storePaymobPublicKey(paymobPublicKey);
    const inline = {
      provider: "paymob" as const,
      orderId,
      clientSecret,
      publicKey: paymobPublicKey,
    };
    if (options.inline) return { kind: "inline", inline };
    navigate("/checkout/payment/paymob");
    return { kind: "inline", inline };
  }

  if (payment.paymentAction === "INLINE_CARD" && clientSecret && publishableKey) {
    storeStripeClientSecret(clientSecret);
    storeStripePublishableKey(publishableKey);
    const inline = {
      provider: "stripe" as const,
      orderId,
      clientSecret,
      publishableKey,
    };
    if (options.inline) return { kind: "inline", inline };
    navigate("/checkout/payment/stripe");
    return { kind: "inline", inline };
  }

  const action = (payment.paymentAction ?? "").toUpperCase();
  const wantsRedirect =
    action === "REDIRECT" ||
    action === "REDIRECT_REQUIRED" ||
    (isPaymob && Boolean(payment.redirectUrl)) ||
    (isTelr && Boolean(payment.redirectUrl)) ||
    (isTabby && Boolean(payment.redirectUrl));

  if (wantsRedirect) {
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

  if (isPaymob || isTelr || isTabby) {
    throw new PaymentGatewayError(payment.warnings ?? []);
  }

  // No gateway step, or the provider isn't executing on this environment
  // (PENDING_PROVIDER_EXECUTION). The order exists either way, so show it — the
  // confirmation page reports the payment as pending and offers to retry.
  window.location.replace(`/order-confirmation/${orderId}`);
  return { kind: "confirmation" };
}
