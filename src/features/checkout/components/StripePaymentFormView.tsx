"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  loadStripe,
  type StripeElementsOptions,
  type StripePaymentElementOptions,
} from "@stripe/stripe-js";
import { LoaderMark } from "@/components/ui/PageLoading";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useHydrated } from "@/hooks/useHydrated";
import { getOrder, pollUntilPaymentSettles } from "../api/orders.service";
import type { OrderResponse } from "../types/checkout";
import {
  clearPaymentState,
  getStoredOrderId,
  getStoredStripeClientSecret,
  getStoredStripePublishableKey,
} from "../utils/checkoutSession";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";

function stripeErrorMessage(code?: string, declineCode?: string): string {
  if (declineCode === "insufficient_funds") return "Insufficient funds. Please try another card.";
  if (code === "card_declined" || declineCode === "generic_decline") {
    return "Your card was declined. Please try another card.";
  }
  if (code === "expired_card") return "Your card has expired.";
  if (code === "incorrect_cvc") return "The security code is incorrect.";
  if (code === "incorrect_number" || code === "invalid_number") return "The card number is invalid.";
  if (code === "processing_error") return "A processing error occurred. Please try again.";
  return "Payment failed. Please try another card or contact your bank.";
}

/** Brand tokens from v5-landing.css — Stripe's iframe can't read our CSS variables. */
const BRAND = {
  copper: "#015696",
  ink: "#241f1b",
  ink2: "#5b5148",
  line: "#d9ccb4",
  danger: "#b4483f",
};
const FONT_FAMILY = '"Benton Sans Wide", system-ui, sans-serif';

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function StripeForm({ orderId, order }: { orderId: string; order: OrderResponse | undefined }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);

  const shipping = order?.addresses?.find((a) => a.addressType === "SHIPPING");
  const elementOptions: StripePaymentElementOptions = {
    layout: "tabs",
    // Link's "save my info" sign-up clutters a one-off card payment.
    wallets: { link: "never" },
    terms: { card: "never" },
    defaultValues: {
      billingDetails: {
        name: order?.customer?.fullName ?? shipping?.fullName ?? undefined,
        email: order?.customer?.email ?? undefined,
        address: shipping?.countryCode ? { country: shipping.countryCode } : undefined,
      },
    },
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPhase("confirming");
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      // Only followed when the card needs a 3DS redirect; that page polls the backend.
      confirmParams: { return_url: `${window.location.origin}/checkout/payment/success` },
      redirect: "if_required",
    });

    if (error) {
      // Stripe-side rejection — the same PaymentIntent can be retried in place.
      setErrorMsg(stripeErrorMessage(error.code, error.decline_code));
      setPhase("idle");
      return;
    }

    // Confirmation comes from the webhook, not from confirmPayment resolving.
    setPhase("polling");
    const result = await pollUntilPaymentSettles(orderId);
    if (result.success) {
      clearPaymentState();
      router.replace(`/order-confirmation/${orderId}`);
      return;
    }

    setPhase("idle");
    if (result.status === "TIMEOUT") {
      setErrorMsg(
        "Your payment is taking longer than expected to confirm. Please check your email before trying again.",
      );
    } else {
      // The backend marked it failed — this PaymentIntent is done; start a new attempt.
      setNeedsRetry(true);
      setErrorMsg(
        result.status === "DECLINED"
          ? "Your card was declined. Please start a new payment attempt with another card."
          : "We couldn’t confirm your payment. If your card was charged, please contact us before retrying.",
      );
    }
  }

  if (phase === "polling") {
    return (
      <div className="stripe-pay__state" aria-live="polite" aria-busy="true">
        <LoaderMark size={84} />
        <p className="stripe-pay__state-title">Confirming your payment…</p>
        <p className="checkout-note">This usually takes a few seconds. Please don’t close this page.</p>
      </div>
    );
  }

  const total = order ? formatMoney(Number(order.totals.total), order.currency) : null;

  return (
    <form className="cbox__body" onSubmit={handleSubmit}>
      {!ready && !loadFailed ? (
        <div className="stripe-pay__state" role="status" aria-live="polite">
          <LoaderMark size={72} />
          <p className="checkout-note">Loading secure card form…</p>
        </div>
      ) : null}

      {loadFailed ? (
        <p className="checkout-error" role="alert">
          We couldn’t load the secure card form. Please refresh the page or{" "}
          <Link className="checkout-link" href="/checkout/payment/cancel">
            choose another way to pay
          </Link>
          .
        </p>
      ) : null}

      {/* Stays mounted while loading so Stripe can boot it; revealed on ready. */}
      <div className={`stripe-pay__element ${ready ? "" : "is-loading"}`}>
        <PaymentElement
          options={elementOptions}
          onReady={() => setReady(true)}
          onLoadError={() => setLoadFailed(true)}
        />
      </div>

      {ready ? (
        <>
          {errorMsg ? (
            <p className="checkout-error" role="alert">
              {errorMsg}
              {needsRetry ? (
                <>
                  {" "}
                  <Link className="checkout-link" href="/checkout/payment/cancel">
                    Start a new attempt
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <button
            type="submit"
            className="checkout-cta"
            disabled={!stripe || !elements || phase !== "idle" || needsRetry}
          >
            <span>
              {phase === "confirming" ? "Processing…" : total ? `Pay ${total}` : "Pay now"}
            </span>
            <b className="arrow" aria-hidden="true">↗</b>
          </button>
          <p className="stripe-pay__trust">
            <LockIcon />
            <span>Secured by Stripe — your card details never touch our servers.</span>
          </p>
        </>
      ) : null}
    </form>
  );
}

function OrderSummary({ order, loading }: { order: OrderResponse | undefined; loading: boolean }) {
  if (loading) {
    return (
      <aside className="checkout-summary stripe-pay__summary" aria-label="Order summary" aria-busy="true">
        <h2>Your order</h2>
        <div className="stripe-pay__state">
          <LoaderMark size={56} />
        </div>
      </aside>
    );
  }
  if (!order) return null;

  const { totals, currency } = order;
  const shipping = Number(totals.shipping);

  return (
    <aside className="checkout-summary stripe-pay__summary" aria-label="Order summary">
      <h2>Your order</h2>
      {order.orderNumber ? (
        <p className="stripe-pay__order-no">
          Order <span dir="ltr">{order.orderNumber}</span>
        </p>
      ) : null}
      <div className="checkout-lines">
        {order.lines.map((line) => {
          const qty = Number.parseInt(line.quantity, 10) || 1;
          const thumb = line.imageUrl?.startsWith("http") ? line.imageUrl : null;
          return (
            <article className="coline" key={line.orderLineId}>
              <div className="coline__media">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : null}
                <b>{qty}</b>
              </div>
              <div className="coline__body">
                <h3>{line.productName ?? line.sku}</h3>
                {line.variantName ? <p>{line.variantName}</p> : null}
              </div>
              <span className="coline__price" dir="ltr">
                {formatMoney(Number(line.lineTotal), line.currencyCode || currency)}
              </span>
            </article>
          );
        })}
      </div>
      <dl className="checkout-totals">
        <div>
          <dt>Subtotal</dt>
          <dd dir="ltr">{formatMoney(Number(totals.subtotal), currency)}</dd>
        </div>
        {Number(totals.discount) > 0 ? (
          <div>
            <dt>Discount</dt>
            <dd dir="ltr">−{formatMoney(Number(totals.discount), currency)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Shipping</dt>
          <dd dir="ltr">{shipping > 0 ? formatMoney(shipping, currency) : "Free"}</dd>
        </div>
        {Number(totals.tax) > 0 ? (
          <div>
            <dt>Tax</dt>
            <dd dir="ltr">{formatMoney(Number(totals.tax), currency)}</dd>
          </div>
        ) : null}
        <div className="checkout-totals-line">
          <dt>Total</dt>
          <dd dir="ltr">{formatMoney(Number(totals.total), currency)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function StripePaymentFormView() {
  const hydrated = useHydrated();
  const router = useRouter();

  // Read once after hydration. The client secret stays in sessionStorage only.
  const ctx = useMemo(
    () =>
      hydrated
        ? {
            clientSecret: getStoredStripeClientSecret(),
            publishableKey: getStoredStripePublishableKey(),
            orderId: getStoredOrderId(),
          }
        : null,
    [hydrated],
  );
  const publishableKey = ctx?.publishableKey ?? null;
  const orderId = ctx?.orderId ?? null;
  // The key arrives on the initiate response — never hardcoded.
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId as string),
    enabled: Boolean(orderId && ctx?.clientSecret),
    retry: 1,
    staleTime: 60_000,
  });

  // Already paid (e.g. back button after success) — don't offer to charge again.
  const paymentStatus = orderQuery.data?.paymentStatus?.toUpperCase();
  const alreadyPaid = paymentStatus === "PAID" || paymentStatus === "AUTHORIZED";
  useEffect(() => {
    if (!alreadyPaid || !orderId) return;
    clearPaymentState();
    router.replace(`/order-confirmation/${orderId}`);
  }, [alreadyPaid, orderId, router]);

  if (!hydrated || alreadyPaid) {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState title="Loading secure payment…" />
      </CheckoutStateShell>
    );
  }

  if (!ctx?.clientSecret || !orderId || !stripePromise) {
    return (
      <CheckoutStateShell current="Payment">
        <section className="checkout-empty">
          <p className="collection-head__eyebrow">Payment</p>
          <h1 className="collection-head__title">This payment session has expired.</h1>
          <p>If you already placed an order, you can finish paying for it from here.</p>
          <Link className="checkout-cta checkout-cta--inline" href="/checkout/payment/cancel">
            <span>Retry payment</span>
            <b className="arrow" aria-hidden="true">↗</b>
          </Link>
        </section>
      </CheckoutStateShell>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret: ctx.clientSecret,
    fonts: [400, 500].map((weight) => ({
      family: "Benton Sans Wide",
      src: `url(${window.location.origin}/fonts/benton-sans-wide-${weight}.ttf)`,
      weight: String(weight),
    })),
    appearance: {
      theme: "stripe",
      variables: {
        fontFamily: FONT_FAMILY,
        fontSizeBase: "14px",
        colorPrimary: BRAND.copper,
        colorBackground: "#ffffff",
        colorText: BRAND.ink,
        colorTextSecondary: BRAND.ink2,
        colorTextPlaceholder: "#a3978a",
        colorDanger: BRAND.danger,
        colorIcon: BRAND.ink2,
        borderRadius: "4px",
        spacingUnit: "4px",
        gridRowSpacing: "16px",
      },
      rules: {
        ".Label": {
          fontSize: "10px",
          fontWeight: "500",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: BRAND.ink2,
          marginBottom: "6px",
        },
        ".Input": {
          border: `1px solid ${BRAND.line}`,
          boxShadow: "none",
          padding: "12px 14px",
        },
        ".Input:focus": {
          borderColor: BRAND.copper,
          boxShadow: `0 0 0 1px ${BRAND.copper}`,
        },
        ".Input--invalid": {
          borderColor: BRAND.danger,
          boxShadow: "none",
        },
        ".Tab": {
          border: `1px solid ${BRAND.line}`,
          boxShadow: "none",
        },
        ".Tab--selected": {
          borderColor: BRAND.copper,
          boxShadow: `0 0 0 1px ${BRAND.copper}`,
        },
      },
    },
  };

  return (
    <CheckoutStateShell current="Payment">
      <header className="checkout-head">
        <h1 className="collection-head__title">Payment</h1>
        <ol className="checkout-steps">
          <li>
            <Link href="/cart">Bag</Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>Details</li>
          <li aria-hidden="true">·</li>
          <li className="is-current">Payment</li>
        </ol>
      </header>

      <div className="checkout-layout stripe-pay">
        <div className="checkout-form">
          <section className="cbox" aria-labelledby="card-payment-heading">
            <div className="cbox__head">
              <span className="cbox__num">
                <LockIcon />
              </span>
              <h2 id="card-payment-heading">Card details</h2>
              <span className="stripe-pay__brands" aria-label="Visa, Mastercard and American Express accepted">
                Visa · Mastercard · Amex
              </span>
            </div>
            <Elements stripe={stripePromise} options={options}>
              <StripeForm orderId={orderId} order={orderQuery.data} />
            </Elements>
          </section>
          <p className="checkout-legal">
            Changed your mind? <Link href="/checkout/payment/cancel">Cancel payment</Link> — your order stays saved.
          </p>
        </div>

        <OrderSummary order={orderQuery.data} loading={orderQuery.isPending} />
      </div>
    </CheckoutStateShell>
  );
}
