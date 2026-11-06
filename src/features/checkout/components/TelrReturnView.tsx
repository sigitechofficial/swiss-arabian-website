"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { pollUntilPaymentSettles } from "../api/orders.service";
import {
  clearPaymentState,
  getStoredOrderId,
  getStoredPaymentTransactionId,
} from "../utils/checkoutSession";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { collectionTitle, doneEm, doneTitle, stateEyebrow, stateIntro } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
  checkoutDoneActions,
  checkoutEmpty,
  checkoutLink,
  checkoutNote,
} from "@/styles/checkoutChrome";

type TelrResultHint = "authorised" | "declined" | "cancelled" | "unknown";

type SettleOutcome =
  | { kind: "paid"; orderId: string }
  | { kind: "failed"; status: string; orderId: string | null }
  | { kind: "timeout"; orderId: string | null }
  | { kind: "hint-only"; hint: TelrResultHint };

/**
 * Telr HPP return — BE contract `/payments/telr/return`.
 * Query `result` is a UX hint only (`settlementAuthoritative = false`).
 * Never show Paid / Success from the query string; poll platform status.
 */
function parseResultHint(raw: string | null): TelrResultHint {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "authorised" || value === "authorized") return "authorised";
  if (value === "declined") return "declined";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  return "unknown";
}

function hintCopy(hint: TelrResultHint): { eyebrow: string; title: ReactNode; body: string } {
  switch (hint) {
    case "authorised":
      return {
        eyebrow: "Verification pending",
        title: (
          <>
            Payment submitted — we’re confirming with the <em className={doneEm}>bank</em>.
          </>
        ),
        body: "Don’t close this page. We’ll update as soon as the bank confirms.",
      };
    case "declined":
      return {
        eyebrow: "Payment declined",
        title: (
          <>
            Payment was <em className={doneEm}>declined</em>.
          </>
        ),
        body: "You can try another method. Your order is saved and not marked paid.",
      };
    case "cancelled":
      return {
        eyebrow: "Payment cancelled",
        title: (
          <>
            Payment was <em className={doneEm}>cancelled</em>.
          </>
        ),
        body: "Your order is not paid. You can return to checkout and try again.",
      };
    default:
      return {
        eyebrow: "Verification pending",
        title: (
          <>
            We’re confirming your <em className={doneEm}>payment</em>.
          </>
        ),
        body: "Don’t close this page. Final status comes from our systems — not this return link.",
      };
  }
}

export function TelrReturnView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();

  const hint = useMemo(
    () => parseResultHint(searchParams.get("result")),
    [searchParams],
  );
  const paymentTransactionId = searchParams.get("paymentTransactionId");
  const paymentAttemptId = searchParams.get("paymentAttemptId");
  const provider = searchParams.get("provider");
  const zone = searchParams.get("zone");

  const orderId = hydrated ? getStoredOrderId() : null;
  const storedTxnId = hydrated ? getStoredPaymentTransactionId() : null;

  const [polled, setPolled] = useState<SettleOutcome | null>(null);
  const started = useRef(false);

  // No local order to check — all we have is Telr's `result=` hint.
  const outcome: SettleOutcome | null =
    hydrated && !orderId ? { kind: "hint-only", hint } : polled;

  useEffect(() => {
    if (!hydrated || !orderId || started.current) return;
    started.current = true;

    // Platform status is authoritative for every hint (incl. declined/cancelled):
    // poll ~30s while PENDING/UNKNOWN; success only on PAID, failure only on a
    // terminal failure status. Still unsettled → "confirming" (BE settles it in
    // the background), never an error.
    void (async () => {
      const result = await pollUntilPaymentSettles(orderId);
      if (result.success) {
        clearPaymentState();
        setPolled({ kind: "paid", orderId });
        router.replace(`/order-confirmation/${orderId}`);
        return;
      }
      if (result.status === "TIMEOUT") {
        setPolled({ kind: "timeout", orderId });
        return;
      }
      setPolled({ kind: "failed", status: result.status, orderId });
    })();
  }, [hydrated, hint, orderId, router]);

  if (!hydrated || !outcome) {
    const pending = hintCopy(hint === "unknown" ? "authorised" : hint);
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState
          eyebrow={pending.eyebrow}
          title={
            hint === "declined" || hint === "cancelled"
              ? "Checking payment status…"
              : "Payment submitted — we’re confirming with the bank."
          }
          body="Don’t close this page."
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "paid") {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState
          eyebrow="Payment"
          title="Payment confirmed…"
          body="Taking you to your order."
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "timeout") {
    // Telr said declined/cancelled but the platform hasn't settled — don't
    // claim the payment was received; just say we're still confirming.
    const unconfirmedFailure = hint === "declined" || hint === "cancelled";
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutDone}>
          <p className={stateEyebrow}>Confirming payment</p>
          <h1 className={doneTitle}>
            {unconfirmedFailure ? (
              <>
                We’re still <em className={doneEm}>confirming</em> your payment status…
              </>
            ) : (
              <>
                Payment received, <em className={doneEm}>confirming</em>…
              </>
            )}
          </h1>
          <p className={stateIntro}>
            {unconfirmedFailure
              ? "This usually takes a couple of minutes. Check your order status shortly before trying again."
              : "This usually takes a couple of minutes. We’ll email you when it’s confirmed — there’s no need to pay again."}
          </p>
          <MetaNote
            paymentTransactionId={paymentTransactionId ?? storedTxnId}
            paymentAttemptId={paymentAttemptId}
            provider={provider}
            zone={zone}
          />
          <div className={checkoutDoneActions}>
            {outcome.orderId ? (
              <LocaleLink
                className={`${checkoutCta} ${checkoutCtaInline}`}
                href={`/order-confirmation/${outcome.orderId}?verify=1`}
              >
                <span>Check order status</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            ) : (
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
                <span>Return home</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            )}
            {outcome.orderId ? (
              <LocaleLink className={checkoutLink} href="/">
                Return home
              </LocaleLink>
            ) : null}
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "failed") {
    const declined = outcome.status === "DECLINED";
    const cancelled = outcome.status === "CANCELLED";
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutDone}>
          <p className={stateEyebrow}>
            {cancelled ? "Payment cancelled" : declined ? "Payment declined" : "Payment unsuccessful"}
          </p>
          <h1 className={doneTitle}>
            {cancelled ? (
              <>
                Payment was <em className={doneEm}>cancelled</em>.
              </>
            ) : declined ? (
              <>
                Payment was <em className={doneEm}>declined</em>.
              </>
            ) : (
              <>
                Your payment <em className={doneEm}>didn’t go through</em>.
              </>
            )}
          </h1>
          <p className={stateIntro}>
            {cancelled
              ? "Your order is not paid. You can try again when you’re ready."
              : declined
                ? "You can try another method. Your order is saved and not marked paid."
                : "We couldn’t confirm this payment. Your order is saved — you can try again."}
          </p>
          <MetaNote
            paymentTransactionId={paymentTransactionId ?? storedTxnId}
            paymentAttemptId={paymentAttemptId}
            provider={provider}
            zone={zone}
          />
          <div className={checkoutDoneActions}>
            <LocaleLink
              className={`${checkoutCta} ${checkoutCtaInline}`}
              href={
                outcome.orderId
                  ? `/checkout/payment/cancel?orderId=${encodeURIComponent(outcome.orderId)}`
                  : "/checkout/payment/cancel"
              }
            >
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

  // hint-only (no order in storage, or declined/cancelled without platform Paid)
  const resultHint = outcome.hint;
  const copy = hintCopy(resultHint);
  return (
    <CheckoutStateShell current="Payment">
      <section className={checkoutDone}>
        <p className={stateEyebrow}>{copy.eyebrow}</p>
        <h1 className={doneTitle}>{copy.title}</h1>
        <p className={stateIntro}>{copy.body}</p>
        <MetaNote
          paymentTransactionId={paymentTransactionId ?? storedTxnId}
          paymentAttemptId={paymentAttemptId}
          provider={provider}
          zone={zone}
        />
        {!orderId ? (
          <section className={checkoutEmpty} style={{ marginTop: "1.5rem", padding: 0 }}>
            <h2 className={collectionTitle} style={{ fontSize: "1.05rem" }}>
              We couldn’t match this return to a local order.
            </h2>
            <p>If you completed a payment, your confirmation email has the details.</p>
          </section>
        ) : null}
        <div className={checkoutDoneActions}>
          {orderId ? (
            <LocaleLink
              className={`${checkoutCta} ${checkoutCtaInline}`}
              href={
                resultHint === "authorised" || resultHint === "unknown"
                  ? `/order-confirmation/${orderId}?verify=1`
                  : `/checkout/payment/cancel?orderId=${encodeURIComponent(orderId)}`
              }
            >
              <span>
                {resultHint === "authorised" || resultHint === "unknown"
                  ? "Check order status"
                  : "Try again"}
              </span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          ) : (
            <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
              <span>Return home</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          )}
          {orderId ? (
            <LocaleLink className={checkoutLink} href="/">
              Return home
            </LocaleLink>
          ) : null}
        </div>
      </section>
    </CheckoutStateShell>
  );
}

function MetaNote({
  paymentTransactionId,
  paymentAttemptId,
  provider,
  zone,
}: {
  paymentTransactionId: string | null;
  paymentAttemptId: string | null;
  provider: string | null;
  zone: string | null;
}) {
  const bits = [
    provider ? `Provider ${provider}` : null,
    zone ? `Zone ${zone}` : null,
    paymentTransactionId ? `Txn ${paymentTransactionId.slice(0, 8)}…` : null,
    paymentAttemptId ? `Attempt ${paymentAttemptId.slice(0, 8)}…` : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className={checkoutNote}>{bits.join(" · ")}</p>;
}
