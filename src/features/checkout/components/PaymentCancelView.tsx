"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { checkoutErrorMessage } from "../utils/checkoutIssues";
import {
  getStoredOrderId,
  getStoredOrderNumber,
  getStoredPaymentMethodId,
  getStoredZonePaymentMethodId,
  incrementPayAttempt,
  storeOrderId,
} from "../utils/checkoutSession";
import { PaymentGatewayError, startPayment } from "../utils/startPayment";
import { CheckoutStateShell } from "./CheckoutStateShell";
import { collectionTitle, doneEm, doneTitle, stateEyebrow, stateIntro } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
  checkoutDoneActions,
  checkoutEmpty,
  checkoutError,
  checkoutLink,
} from "@/styles/checkoutChrome";

const GATEWAY_ERROR =
  "Card payment couldn’t be started right now. Your order is saved — please try again in a moment, or contact us if it keeps happening.";

/**
 * Gateway cancel URL, and the retry screen for any placed-but-unpaid order.
 * Cancelling payment never cancels the order — it just waits to be paid.
 */
export function PaymentCancelView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const storedOrderId = hydrated ? getStoredOrderId() : null;
  const orderId = searchParams.get("orderId") ?? storedOrderId;
  const isStoredOrder = Boolean(orderId && orderId === storedOrderId);
  const orderNumber = isStoredOrder ? getStoredOrderNumber() : null;

  const [retrying, setRetrying] = useState(false);
  // Sent here straight from checkout when the gateway returned no payment page.
  const [error, setError] = useState<string | null>(
    searchParams.get("reason") === "gateway" ? GATEWAY_ERROR : null,
  );

  async function retry() {
    if (!orderId) return;
    setRetrying(true);
    setError(null);
    try {
      // The success page recovers the order from storage after the gateway round-trip.
      storeOrderId(orderId);
      // Gateway sessions are single-use — a retry needs a fresh idempotency key.
      incrementPayAttempt();
      await startPayment(
        orderId,
        (href) => router.push(href),
        // Stored method ids belong to the last order placed in this tab; for any
        // other order let the backend use the method saved on the order.
        isStoredOrder
          ? {
              zonePaymentMethodId: getStoredZonePaymentMethodId(),
              paymentMethodId: getStoredPaymentMethodId(),
            }
          : {},
      );
    } catch (e) {
      setError(
        e instanceof PaymentGatewayError
          ? GATEWAY_ERROR
          : checkoutErrorMessage(e, "We couldn’t restart your payment. Please try again or contact us."),
      );
      setRetrying(false);
    }
  }

  if (hydrated && !orderId) {
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>Payment</p>
          <h1 className={collectionTitle}>This payment session has ended.</h1>
          <p>Start again from your bag to place a new order.</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/cart">
            <span>Back to bag</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  return (
    <CheckoutStateShell current="Payment">
      <section className={checkoutDone}>
        <p className={stateEyebrow}>Payment not completed</p>
        <h1 className={doneTitle}>
          Your order is <em className={doneEm}>saved</em>.
        </h1>
        <p className={stateIntro}>
          {orderNumber ? `Order ${orderNumber} is waiting for payment. ` : "Your order is waiting for payment. "}
          You can finish paying now, or come back to it later.
        </p>
        {error ? (
          <p className={checkoutError} role="alert">
            {error}
          </p>
        ) : null}
        <div className={checkoutDoneActions}>
          <button
            type="button"
            className={`${checkoutCta} ${checkoutCtaInline}`}
            onClick={() => void retry()}
            disabled={retrying || !hydrated}
          >
            <span>{retrying ? "Opening payment…" : "Retry payment"}</span>
            <b aria-hidden="true">↗</b>
          </button>
          <LocaleLink className={checkoutLink} href="/">
            Return home
          </LocaleLink>
        </div>
      </section>
    </CheckoutStateShell>
  );
}
