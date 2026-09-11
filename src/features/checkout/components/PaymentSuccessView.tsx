"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { clearPaymentState, getStoredOrderId } from "../utils/checkoutSession";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";

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
        <section className="checkout-empty">
          <p className="collection-head__eyebrow">Payment</p>
          <h1 className="collection-head__title">We couldn’t find your order.</h1>
          <p>If you completed a payment, your confirmation email has the details.</p>
          <Link className="checkout-cta checkout-cta--inline" href="/">
            <span>Return home</span>
            <b className="arrow" aria-hidden="true">↗</b>
          </Link>
        </section>
      </CheckoutStateShell>
    );
  }

  if (outcome?.kind === "timeout") {
    return (
      <CheckoutStateShell current="Payment">
        <section className="checkout-done">
          <p className="collection-head__eyebrow">Still processing</p>
          <h1 className="collection-head__title">
            Your payment is taking <em className="collection-head__em">a little longer</em>.
          </h1>
          <p className="collection-head__intro">
            We’ll email you as soon as it’s confirmed — there’s no need to pay again.
          </p>
          <div className="checkout-done__actions">
            <Link className="checkout-cta checkout-cta--inline" href={`/order-confirmation/${orderId}?verify=1`}>
              <span>Check order status</span>
              <b className="arrow" aria-hidden="true">↗</b>
            </Link>
            <Link className="checkout-link" href="/">
              Return home
            </Link>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  const declined = outcome?.kind === "failed" && outcome.status === "DECLINED";
  return (
    <CheckoutStateShell current="Payment">
      <section className="checkout-done">
        <p className="collection-head__eyebrow">Payment unsuccessful</p>
        <h1 className="collection-head__title">
          Your payment <em className="collection-head__em">didn’t go through</em>.
        </h1>
        <p className="collection-head__intro">
          {declined
            ? "Your card was declined by the issuer. Your order is saved — you can try another card."
            : "We couldn’t process your payment. Your order is saved — you can try again."}
        </p>
        <div className="checkout-done__actions">
          <Link className="checkout-cta checkout-cta--inline" href="/checkout/payment/cancel">
            <span>Try again</span>
            <b className="arrow" aria-hidden="true">↗</b>
          </Link>
          <Link className="checkout-link" href="/">
            Return home
          </Link>
        </div>
      </section>
    </CheckoutStateShell>
  );
}
