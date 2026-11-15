"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { CheckoutElementsProvider, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutSession } from "@stripe/stripe-js";
import { LoaderMark } from "@/components/ui/PageLoading";
import { showsDistinctSize } from "@/features/cart/utils/showsDistinctSize";
import { formatMoney } from "@/features/home/utils/formatMoney";
import type { OrderResponse } from "../types/checkout";
import { useCardPaymentSession } from "../hooks/useCardPaymentSession";
import { useStripePromise, useStripeSessionOptions } from "../hooks/useStripeSessionOptions";
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
  checkoutForm,
  checkoutHead,
  checkoutLayout,
  checkoutLegal,
  checkoutLines,
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
  stripePayForm,
  stripePayHead,
  stripePayNum,
  stripePayOrderNo,
  stripePayState,
  stripePaySummary,
  stripePaySummaryState,
} from "@/styles/checkoutChrome";
import { StripeCardPaymentForm, StripePayLockIcon } from "./StripeCardPaymentForm";

function sessionPayable(session: StripeCheckoutSession): { amount: number; currency: string } {
  const divisor = session.minorUnitsAmountDivisor || 100;
  return {
    amount: session.total.total.minorUnitsAmount / divisor,
    currency: session.currency.toUpperCase(),
  };
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
              <StripePayLockIcon />
            </span>
            <h2 id="card-payment-heading">Pay with Stripe</h2>
            <span className={stripePayBrands} aria-label="Visa, Mastercard and American Express accepted">
              Visa · Mastercard · Amex
            </span>
          </div>
          <div className={cboxBody}>
            <StripeCardPaymentForm
              orderId={orderId}
              email={order?.customer?.email}
              name={order?.customer?.fullName ?? order?.addresses?.find((a) => a.addressType === "SHIPPING")?.fullName}
              phone={typeof order?.metadata?.customerPhone === "string" ? order.metadata.customerPhone : null}
              country={order?.addresses?.find((a) => a.addressType === "SHIPPING")?.countryCode}
            />
          </div>
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
  const session = useCardPaymentSession("stripe");
  const { hydrated, orderId, clientSecret, alreadyPaid } = session;
  const publishableKey = session.providerKey;
  const stripePromise = useStripePromise(publishableKey);
  const options = useStripeSessionOptions(clientSecret, session.order);

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
        <StripeCheckoutLayout orderId={orderId} order={session.order} loading={session.orderLoading} />
      </CheckoutElementsProvider>
    </CheckoutStateShell>
  );
}
