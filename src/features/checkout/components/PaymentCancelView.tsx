"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { storedOrderIdIf, usePaymentRetry } from "../hooks/usePaymentReturn";
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
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const { orderId, orderNumber, retrying, error: retryError, retry } = usePaymentRetry({
    queryOrderId: searchParams.get("orderId"),
    storedOrderId: storedOrderIdIf(hydrated),
    // Sent here straight from checkout when the gateway returned no payment page.
    gatewayReason: searchParams.get("reason") === "gateway",
  });
  const error = !retryError
    ? null
    : retryError.kind === "gateway"
      ? GATEWAY_ERROR
      : retryError.kind === "rejected"
        ? retryError.message
        : retryError.message || "We couldn’t restart your payment. Please try again or contact us.";

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
