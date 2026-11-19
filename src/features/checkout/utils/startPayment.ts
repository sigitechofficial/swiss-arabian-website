import { checkoutHref, currentCheckoutLocale, rememberCheckoutLocale } from "./checkoutLocale";
import { initiatePayment } from "../api/orders.service";
import { ApiClientError } from "@/lib/api/apiError";
import {
  getPayAttempt,
  storePaymentTransactionId,
  storePaymobClientSecret,
  storePaymobPublicKey,
  storeStripeClientSecret,
  storeStripePublishableKey,
} from "./checkoutSession";
import { tabbyRejectionFrom, type TabbyMessage } from "./tabby";
import { isTamaraCheckoutUrl, tamaraRejectionFrom } from "./tamara";

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
 * The provider declined to offer this payment (Tabby or Tamara said no). Not a
 * fault: the order is saved and the shopper picks another method. `messages`
 * is the provider's own wording.
 */
export type RejectingProvider = "tabby" | "tamara";

export class PaymentRejectedError extends Error {
  readonly provider: RejectingProvider;
  readonly messages: TabbyMessage;

  constructor(provider: RejectingProvider, messages: TabbyMessage) {
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
  /**
   * Integration account the session was opened with. The backend reuses the
   * prepared session only when the payment runs under this same account.
   */
  accountId?: string | null;
};

export async function startPayment(
  orderId: string,
  navigate: (href: string) => void,
  method: {
    zonePaymentMethodId?: string | null;
    paymentMethodId?: string | null;
    /** Used to pick Telr / Tabby / Tamara return URLs before initiate responds. */
    providerCode?: string | null;
  } = {},
  options: { inline?: boolean; prepared?: PreparedInlinePayment | null } = {},
): Promise<PaymentStartResult> {
  const origin = window.location.origin;
  // The confirmation / cancel pages open in the language checkout is in.
  const locale = currentCheckoutLocale();
  rememberCheckoutLocale(window.location.pathname);
  const prepared = options.prepared;
  const hintProvider = (method.providerCode ?? "").toLowerCase();
  const isTelrHint = hintProvider.includes("telr");
  const isTabbyHint = hintProvider.includes("tabby");
  const isTamaraHint = hintProvider.includes("tamara");
  // BE Telr contract: `/payments/telr/return` (not order-confirmation).
  // BE Tabby contract: `/payments/tabby/return` for success and cancel — the
  // backend adds `result=success|cancel` and builds the failure URL itself.
  // BE Tamara contract: `/payments/tamara/return` the same way — the backend
  // adds `orderId`, the attempt ids, `zone` and `result=success|cancel|failure`.
  // Shared Stripe/Paymob keep the existing confirmation return.
  // Tabby's return address is fixed and unprefixed: `?lang=` carries the
  // checkout language so the return page (and Tabby's cancel / not-approved
  // wording) opens in it (Tabby QA, Nov 2026). The backend keeps the query on
  // the success, cancel and failure links. Tamara's fixed return address works
  // the same way.
  const tabbyReturn = `${origin}/payments/tabby/return?lang=${encodeURIComponent(locale)}`;
  const tamaraReturn = `${origin}/payments/tamara/return?lang=${encodeURIComponent(locale)}`;
  const returnUrl = isTelrHint
    ? `${origin}/payments/telr/return`
    : isTabbyHint
      ? tabbyReturn
      : isTamaraHint
        ? tamaraReturn
        : `${origin}${checkoutHref(`/order-confirmation/${encodeURIComponent(orderId)}`)}`;
  const cancelUrl = isTelrHint
    ? `${origin}/payments/telr/return?result=cancelled`
    : isTabbyHint
      ? tabbyReturn
      : isTamaraHint
        ? tamaraReturn
        : `${origin}${checkoutHref("/checkout/payment/cancel")}`;

  let payment: Awaited<ReturnType<typeof initiatePayment>>;
  try {
    payment = await initiatePayment(orderId, {
      idempotencyKey: prepared?.correlationId ?? `pay-${orderId}-${getPayAttempt()}`,
      returnUrl,
      cancelUrl,
      // Saved on the order: Tabby's page opens in it (`lang`), emails follow it.
      locale,
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
              ...(prepared.accountId ? { preparedAccountId: prepared.accountId } : {}),
            },
          }
        : {}),
    });
  } catch (e) {
    // The backend answers PAYMENT_FAILED when the gateway step couldn't start (the
    // order is saved). Same retry step as a gateway that returned no session.
    if (e instanceof ApiClientError && e.code === "PAYMENT_FAILED") {
      throw new PaymentGatewayError([]);
    }
    throw e;
  }

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
  const isTamara = provider.includes("tamara") || isTamaraHint;
  if (isTamara) {
    // Tamara declined before any redirect — show its message, keep the order.
    const rejection = tamaraRejectionFrom(payment.metadata as Record<string, unknown> | null | undefined);
    if (rejection) throw new PaymentRejectedError("tamara", rejection);
  }
  if (provider.includes("smoke")) {
    window.location.replace(checkoutHref(`/order-confirmation/${orderId}`));
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
    (isTabby && Boolean(payment.redirectUrl)) ||
    (isTamara && Boolean(payment.redirectUrl));

  if (wantsRedirect) {
    if (!payment.redirectUrl) {
      // No payment page to send them to — surface an error; never fall through
      // to the confirmation page as if the order were paid.
      throw new PaymentGatewayError(payment.warnings ?? []);
    }
    if (isTamara && !isTamaraCheckoutUrl(payment.redirectUrl)) {
      // Tamara's hosted checkout only ever lives on *.tamara.co.
      throw new PaymentGatewayError(payment.warnings ?? []);
    }
    // Hosted gateway on another origin — a hard navigation, not a client route.
    // The order id is already in storage for the return trip. If the shopper
    // comes back without paying (browser Back, a closed tab, another device),
    // the unpaid order still holds the bag on the server and checkout gives it
    // back (useResumeHeldBag), for every payment method.
    window.location.assign(payment.redirectUrl);
    return { kind: "redirect" };
  }

  if (isPaymob || isTelr || isTabby || isTamara) {
    throw new PaymentGatewayError(payment.warnings ?? []);
  }

  // No gateway step, or the provider isn't executing on this environment
  // (PENDING_PROVIDER_EXECUTION). The order exists either way, so show it — the
  // confirmation page reports the payment as pending and offers to retry.
  window.location.replace(`/order-confirmation/${orderId}`);
  return { kind: "confirmation" };
}
