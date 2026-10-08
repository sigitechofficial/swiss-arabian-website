"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { clearPaymentState, getStoredOrderId } from "../utils/checkoutSession";
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

type Outcome = { kind: "failed"; status: string } | { kind: "timeout" } | null;

/**
 * Gateway return URL (Paymob, and Stripe after a 3DS redirect). The redirect
 * itself proves nothing — the provider webhook decides — so poll the backend.
 */
export function PaymentSuccessView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const orderId = hydrated ? getStoredOrderId() : null;
  const [outcome, setOutcome] = useState<Outcome>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;
    void (async () => {
      const result = await pollUntilPaymentSettles(orderId);
      if (result.success) {
        clearPaymentState();
        router.replace(`/order-confirmation/${orderId}`);
        return;
      }
      setOutcome(
        result.status === "TIMEOUT" ? { kind: "timeout" } : { kind: "failed", status: result.status },
      );
    })();
  }, [orderId, router]);

  if (!hydrated || (orderId && !outcome)) {
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
