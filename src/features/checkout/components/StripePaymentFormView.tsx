"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutElementsSdkOptions, StripeCheckoutSession } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";
import { LoaderMark } from "@/components/ui/PageLoading";
import { showsDistinctSize } from "@/features/cart/utils/showsDistinctSize";
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
import { collectionTitle, pageTitle, stateEyebrow } from "@/styles/shopChrome";
import {
  cbox,
  cboxBody,
  cboxHead,
  cboxNum,
  checkoutCta,
  checkoutCtaInline,
  checkoutEmpty,
  checkoutError,
  checkoutForm,
  checkoutHead,
  checkoutLayout,
  checkoutLegal,
  checkoutLines,
  checkoutLink,
  checkoutNote,
  checkoutStepCurrent,
  checkoutSteps,
  checkoutSummary,
  checkoutTotals,
  checkoutTotalsLine,
  coline,
  colineBody,
  colineMedia,
  colineMeta,
  colineName,
  colinePrice,
  colineTop,
  stripePayBrands,
  stripePayCta,
  stripePayElementLoading,
  stripePayForm,
  stripePayHead,
  stripePayNum,
  stripePayOrderNo,
  stripePayState,
  stripePayStateTitle,
  stripePaySummary,
  stripePaySummaryState,
  stripePayTrust,
} from "@/styles/checkoutChrome";

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

/** Brand tokens — Stripe's iframe can't read our CSS variables. */
const BRAND = {
  copper: "#8c4435",
  ink: "#241f1b",
  ink2: "#5b5148",
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

function checkoutConfirmMessage(error: {
  message: string;
  code?: string | null;
  paymentFailed?: { declineCode: string | null };
}): string {
  if (error.code === "paymentFailed") {
    return stripeErrorMessage("card_declined", error.paymentFailed?.declineCode ?? undefined);
  }
  return error.message || "Payment failed. Please try another card or contact your bank.";
}

function sessionPayable(session: StripeCheckoutSession): { amount: number; currency: string } {
  const divisor = session.minorUnitsAmountDivisor || 100;
  return {
    amount: session.total.total.minorUnitsAmount / divisor,
    currency: session.currency.toUpperCase(),
  };
}

function StripeForm({ orderId }: { orderId: string }) {
  const checkoutState = useCheckoutElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);

  async function confirmStripePayment() {
    if (checkoutState.type !== "success" || phase !== "idle" || needsRetry) return;
    const { checkout } = checkoutState;
    setPhase("confirming");
    setErrorMsg(null);

    try {
      const confirmResult = await checkout.confirm({ redirect: "if_required" });
      if (confirmResult.type === "error") {
        setErrorMsg(checkoutConfirmMessage(confirmResult.error));
        setPhase("idle");
        return;
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Payment failed. Please try another card or contact your bank.");
      setPhase("idle");
      return;
    }

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
      setNeedsRetry(true);
      setErrorMsg(
        result.status === "DECLINED"
          ? "Your card was declined. Please start a new payment attempt with another card."
          : "We couldn’t confirm your payment. If your card was charged, please contact us before retrying.",
      );
    }
  }

  return (
    <div className={cboxBody}>
      {checkoutState.type === "error" ? (
        <p className={checkoutError} role="alert">
          {checkoutState.error.message || "We couldn’t load the secure card form."}{" "}
          <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
            choose another way to pay
          </LocaleLink>
        </p>
      ) : null}

      {phase === "polling" ? (
        <div className={stripePayState} aria-live="polite" aria-busy="true">
          <LoaderMark size={84} />
          <p className={stripePayStateTitle}>Confirming your payment…</p>
          <p className={checkoutNote}>This usually takes a few seconds. Please don’t close this page.</p>
        </div>
      ) : (
        <>
          {!ready && !loadFailed && checkoutState.type !== "error" ? (
            <div className={stripePayState} role="status" aria-live="polite">
              <LoaderMark size={72} />
              <p className={checkoutNote}>Loading secure card form…</p>
            </div>
          ) : null}

          {loadFailed ? (
            <p className={checkoutError} role="alert">
              We couldn’t load the secure card form. Please refresh the page or{" "}
              <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
                choose another way to pay
              </LocaleLink>
              .
            </p>
          ) : null}

          <div className={ready ? undefined : stripePayElementLoading}>
            <PaymentElement
              options={{
                layout: {
                  type: "accordion",
                  defaultCollapsed: false,
                  radios: "always",
                  spacedAccordionItems: true,
                },
                paymentMethodOrder: ["card", "apple_pay", "google_pay", "link"],
                wallets: { applePay: "auto", googlePay: "auto", link: "auto" },
              }}
              onReady={() => setReady(true)}
              onLoadError={() => setLoadFailed(true)}
            />
          </div>

          {errorMsg ? (
            <p className={checkoutError} role="alert">
              {errorMsg}
              {needsRetry ? (
                <>
                  {" "}
                  <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
                    Start a new attempt
                  </LocaleLink>
                </>
              ) : null}
            </p>
          ) : null}
          <button
            type="button"
            className={`${checkoutCta} ${stripePayCta}`}
            disabled={checkoutState.type !== "success" || phase !== "idle" || needsRetry}
            onClick={() => void confirmStripePayment()}
          >
            <span>{phase === "confirming" ? "Processing…" : "Pay now"}</span>
            <b aria-hidden="true">↗</b>
          </button>
        </>
      )}
      <p className={stripePayTrust}>
        <LockIcon />
        <span>Secured by Stripe — your card details never touch our servers.</span>
      </p>
    </div>
  );
}

export function OrderSummary({
  order,
  loading,
  payable,
}: {
  order: OrderResponse | undefined;
  loading: boolean;
  payable?: { amount: number; currency: string } | null;
}) {
  if (loading) {
    return (
      <aside className={`${checkoutSummary} ${stripePaySummary}`} aria-label="Order summary" aria-busy="true">
        <h2>Your order</h2>
        <div className={`${stripePayState} ${stripePaySummaryState}`}>
          <LoaderMark size={56} />
        </div>
      </aside>
    );
  }
  if (!order) return null;

  const { totals, currency } = order;
  const shipping = Number(totals.shipping);

  return (
    <aside className={`${checkoutSummary} ${stripePaySummary}`} aria-label="Order summary">
      <h2>Your order</h2>
      {order.orderNumber ? (
        <p className={stripePayOrderNo}>
          Order <span dir="ltr">{order.orderNumber}</span>
        </p>
      ) : null}
      <div className={checkoutLines}>
        {order.lines.map((line) => {
          const qty = Number.parseInt(line.quantity, 10) || 1;
          const title = line.productName ?? line.sku;
          const thumb = line.imageUrl?.startsWith("http") ? line.imageUrl : null;
          return (
            <article className={coline} key={line.orderLineId}>
              <div className={colineMedia}>
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
              <div className={colineBody}>
                <div className={colineTop}>
                  <h3 className={colineName}>{title}</h3>
                  <p className={colinePrice} dir="ltr">
                    {formatMoney(Number(line.lineTotal), line.currencyCode || currency)}
                  </p>
                </div>
                {showsDistinctSize(title, line.variantName ?? undefined) ? (
                  <p className={colineMeta}>{line.variantName}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <dl className={checkoutTotals}>
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
        <div className={checkoutTotalsLine}>
          <dt>Total</dt>
          <dd dir="ltr">
            {formatMoney(payable?.amount ?? Number(totals.total), payable?.currency ?? currency)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function StripeCheckoutLayout({
  orderId,
  order,
  loading,
}: {
  orderId: string;
  order: OrderResponse | undefined;
  loading: boolean;
}) {
  const checkoutState = useCheckoutElements();
  const payable = checkoutState.type === "success" ? sessionPayable(checkoutState.checkout) : null;

  return (
    <div className={checkoutLayout}>
      <div className={`${checkoutForm} ${stripePayForm}`}>
        <section className={cbox} aria-labelledby="card-payment-heading">
          <div className={`${cboxHead} ${stripePayHead}`}>
            <span className={`${cboxNum} ${stripePayNum}`}>
              <LockIcon />
            </span>
            <h2 id="card-payment-heading">Pay with Stripe</h2>
            <span className={stripePayBrands} aria-label="Visa, Mastercard and American Express accepted">
              Visa · Mastercard · Amex
            </span>
          </div>
          <StripeForm orderId={orderId} />
        </section>
        <p className={checkoutLegal}>
          Changed your mind? <LocaleLink href="/checkout/payment/cancel">Cancel payment</LocaleLink> — your order stays saved.
        </p>
      </div>
      <OrderSummary order={order} loading={loading} payable={payable} />
    </div>
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
    () => (publishableKey ? getStripe(publishableKey) : null),
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

  const shipping = orderQuery.data?.addresses?.find((address) => address.addressType === "SHIPPING");
  const billingCountry = shipping?.countryCode ?? null;
  const customerName = orderQuery.data?.customer?.fullName ?? shipping?.fullName ?? null;
  const clientSecret = ctx?.clientSecret ?? null;
  const options = useMemo<StripeCheckoutElementsSdkOptions | null>(() => {
    if (!clientSecret || typeof window === "undefined") return null;
    return {
      clientSecret,
      elementsOptions: {
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
            borderRadius: "4px",
          },
        },
      },
      ...(billingCountry
        ? {
            defaultValues: {
              billingAddress: {
                name: customerName ?? undefined,
                address: { country: billingCountry },
              },
            },
          }
        : {}),
    };
  }, [billingCountry, clientSecret, customerName]);

  if (!hydrated || alreadyPaid) {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState title="Loading secure payment…" />
      </CheckoutStateShell>
    );
  }

  if (!clientSecret || !orderId || !stripePromise || !options) {
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>Payment</p>
          <h1 className={collectionTitle}>This payment session has expired.</h1>
          <p>If you already placed an order, you can finish paying for it from here.</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/checkout/payment/cancel">
            <span>Retry payment</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  return (
    <CheckoutStateShell current="Payment">
      <header className={checkoutHead}>
        <h1 className={pageTitle}>Payment</h1>
        <ol className={checkoutSteps}>
          <li>
            <LocaleLink href="/cart">Bag</LocaleLink>
          </li>
          <li aria-hidden="true">·</li>
          <li>Details</li>
          <li aria-hidden="true">·</li>
          <li className={checkoutStepCurrent}>Payment</li>
        </ol>
      </header>

      <CheckoutElementsProvider stripe={stripePromise} options={options}>
        <StripeCheckoutLayout orderId={orderId} order={orderQuery.data} loading={orderQuery.isPending} />
      </CheckoutElementsProvider>
    </CheckoutStateShell>
  );
}
