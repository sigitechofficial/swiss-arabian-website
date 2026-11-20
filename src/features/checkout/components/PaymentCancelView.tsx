"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { storedOrderIdIf, usePaymentRetry } from "../hooks/usePaymentReturn";
import { CheckoutStateShell } from "./CheckoutStateShell";
import { EM_SLOT, EmphasisCopy } from "./EmphasisCopy";
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


/**
 * Gateway cancel URL, and the retry screen for any placed-but-unpaid order.
 * Cancelling payment never cancels the order — it just waits to be paid.
 */
export function PaymentCancelView() {
  const copy = useShopCopy();
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
      ? copy("checkout.err.gateway")
      : retryError.kind === "rejected"
        ? retryError.message
        : retryError.message || copy("checkout.err.retryPayment");

  if (hydrated && !orderId) {
    return (
      <CheckoutStateShell current={copy("checkout.state.payment")}>
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>{copy("checkout.state.payment")}</p>
          <h1 className={collectionTitle}>{copy("checkout.state.sessionEnded")}</h1>
          <p>{copy("checkout.state.sessionEndedBody")}</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/cart">
            <span>{copy("checkout.orderChanged.backToBag")}</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  return (
    <CheckoutStateShell current={copy("checkout.state.payment")}>
      <section className={checkoutDone}>
        <p className={stateEyebrow}>{copy("checkout.state.notCompleted")}</p>
        <h1 className={doneTitle}>
          <EmphasisCopy text={copy("checkout.state.savedTitle", EM_SLOT)} em={copy("checkout.state.savedEm")} className={doneEm} />
        </h1>
        <p className={stateIntro}>
          {orderNumber
            ? copy("checkout.state.waitingNumbered", { number: orderNumber })
            : copy("checkout.state.waiting")}{" "}
          {copy("checkout.state.finishLater")}
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
            <span>{retrying ? copy("checkout.state.openingPayment") : copy("checkout.state.retryPayment")}</span>
            <b aria-hidden="true">↗</b>
          </button>
          <LocaleLink className={checkoutLink} href="/">
            {copy("checkout.state.returnHome")}
          </LocaleLink>
        </div>
      </section>
    </CheckoutStateShell>
  );
}
