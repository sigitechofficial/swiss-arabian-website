"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useHydrated } from "@/hooks/useHydrated";
import { storedOrderIdIf, useSettlePayment } from "../hooks/usePaymentReturn";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { collectionTitle, doneEm, doneTitle, stateEyebrow, stateIntro } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
  checkoutDoneActions,
  checkoutEmpty,
  checkoutLink,
} from "@/styles/checkoutChrome";

/**
 * Gateway return URL (Paymob, and Stripe after a 3DS redirect). The redirect
 * itself proves nothing — the provider webhook decides — so poll the backend.
 */
export function PaymentSuccessView() {
  const hydrated = useHydrated();
  const orderId = storedOrderIdIf(hydrated);
  const outcome = useSettlePayment(orderId);

  if (!hydrated || (orderId && (!outcome || outcome.kind === "paid"))) {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState
          eyebrow="Payment"
          title="Confirming your payment…"
          body="This usually takes a few seconds. Please don’t close or refresh this page."
        />
      </CheckoutStateShell>
    );
  }

  if (!orderId) {
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>Payment</p>
          <h1 className={collectionTitle}>We couldn’t find your order.</h1>
          <p>If you completed a payment, your confirmation email has the details.</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
            <span>Return home</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  if (outcome?.kind === "timeout") {
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutDone}>
          <p className={stateEyebrow}>Still processing</p>
          <h1 className={doneTitle}>
            Your payment is taking <em className={doneEm}>a little longer</em>.
          </h1>
          <p className={stateIntro}>
            We’ll email you as soon as it’s confirmed — there’s no need to pay again.
          </p>
          <div className={checkoutDoneActions}>
            <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href={`/order-confirmation/${orderId}?verify=1`}>
              <span>Check order status</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
            <LocaleLink className={checkoutLink} href="/">
              Return home
            </LocaleLink>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  const declined = outcome?.kind === "failed" && outcome.status === "DECLINED";
  return (
    <CheckoutStateShell current="Payment">
      <section className={checkoutDone}>
        <p className={stateEyebrow}>Payment unsuccessful</p>
        <h1 className={doneTitle}>
          Your payment <em className={doneEm}>didn’t go through</em>.
        </h1>
        <p className={stateIntro}>
          {declined
            ? "Your card was declined by the issuer. Your order is saved — you can try another card."
            : "We couldn’t process your payment. Your order is saved — you can try again."}
        </p>
        <div className={checkoutDoneActions}>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/checkout/payment/cancel">
            <span>Try again</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
          <LocaleLink className={checkoutLink} href="/">
            Return home
          </LocaleLink>
        </div>
      </section>
    </CheckoutStateShell>
  );
}
