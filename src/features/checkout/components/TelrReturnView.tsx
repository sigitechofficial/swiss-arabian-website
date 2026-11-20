"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useSettlePayment } from "../hooks/usePaymentReturn";
import {
  getStoredOrderId,
  getStoredPaymentTransactionId,
} from "../utils/checkoutSession";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { EM_SLOT, EmphasisCopy } from "./EmphasisCopy";
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

export type TelrResultHint = "authorised" | "declined" | "cancelled" | "unknown";

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
export function parseResultHint(raw: string | null): TelrResultHint {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "authorised" || value === "authorized") return "authorised";
  if (value === "declined") return "declined";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  return "unknown";
}

/** A sentence with its emphasised phrase, both from the message files. */
function emphasis(t: Translator, key: MessageKey, em: MessageKey): ReactNode {
  return <EmphasisCopy text={t(key, EM_SLOT)} em={t(em)} className={doneEm} />;
}

function hintCopy(hint: TelrResultHint, t: Translator): { eyebrow: string; title: ReactNode; body: string } {
  switch (hint) {
    case "authorised":
      return {
        eyebrow: t("checkout.state.verificationPending"),
        title: emphasis(t, "checkout.telr.authorisedTitle", "checkout.telr.authorisedEm"),
        body: t("checkout.telr.authorisedBody"),
      };
    case "declined":
      return {
        eyebrow: t("checkout.state.declined"),
        title: emphasis(t, "checkout.state.wasTitle", "checkout.state.declinedEm"),
        body: t("checkout.state.declinedBody"),
      };
    case "cancelled":
      return {
        eyebrow: t("checkout.state.cancelled"),
        title: emphasis(t, "checkout.state.wasTitle", "checkout.state.cancelledEm"),
        body: t("checkout.telr.cancelledBody"),
      };
    default:
      return {
        eyebrow: t("checkout.state.verificationPending"),
        title: emphasis(t, "checkout.telr.unknownTitle", "checkout.telr.unknownEm"),
        body: t("checkout.telr.unknownBody"),
      };
  }
}

export function TelrReturnView() {
  const t = useShopCopy();
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

  // The platform status is authoritative for every hint (incl. declined/cancelled):
  // poll ~30s while PENDING/UNKNOWN; success only on PAID, failure only on a
  // terminal failure status. Still unsettled → "confirming" (BE settles it in
  // the background), never an error.
  const settlement = useSettlePayment(orderId);

  // No local order to check — all we have is Telr's `result=` hint.
  const outcome: SettleOutcome | null =
    hydrated && !orderId
      ? { kind: "hint-only", hint }
      : !settlement || !orderId
        ? null
        : settlement.kind === "paid"
          ? { kind: "paid", orderId }
          : settlement.kind === "timeout"
            ? { kind: "timeout", orderId }
            : { kind: "failed", status: settlement.status, orderId };

  if (!hydrated || !outcome) {
    const pending = hintCopy(hint === "unknown" ? "authorised" : hint, t);
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState
          eyebrow={pending.eyebrow}
          title={
            hint === "declined" || hint === "cancelled"
              ? t("checkout.state.checking")
              : t("checkout.telr.submitted")
          }
          body={t("checkout.state.dontClose")}
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "paid") {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState
          eyebrow={t("checkout.state.payment")}
          title={t("checkout.state.paidTitle")}
          body={t("checkout.state.paidBody")}
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "timeout") {
    // Telr said declined/cancelled but the platform hasn't settled — don't
    // claim the payment was received; just say we're still confirming.
    const unconfirmedFailure = hint === "declined" || hint === "cancelled";
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutDone}>
          <p className={stateEyebrow}>{t("checkout.state.confirmingEyebrow")}</p>
          <h1 className={doneTitle}>
            {unconfirmedFailure
              ? emphasis(t, "checkout.telr.stillConfirming", "checkout.telr.confirmingEm")
              : emphasis(t, "checkout.telr.receivedConfirming", "checkout.telr.confirmingEm")}
          </h1>
          <p className={stateIntro}>
            {unconfirmedFailure
              ? t("checkout.telr.unconfirmedFailureBody")
              : t("checkout.telr.receivedBody")}
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
                <span>{t("checkout.state.orderStatus")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            ) : (
              <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
                <span>{t("checkout.state.returnHome")}</span>
                <b aria-hidden="true">↗</b>
              </LocaleLink>
            )}
            {outcome.orderId ? (
              <LocaleLink className={checkoutLink} href="/">
                {t("checkout.state.returnHome")}
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
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutDone}>
          <p className={stateEyebrow}>
            {cancelled ? t("checkout.state.cancelled") : declined ? t("checkout.state.declined") : t("checkout.state.unsuccessful")}
          </p>
          <h1 className={doneTitle}>
            {cancelled
              ? emphasis(t, "checkout.state.wasTitle", "checkout.state.cancelledEm")
              : declined
                ? emphasis(t, "checkout.state.wasTitle", "checkout.state.declinedEm")
                : emphasis(t, "checkout.state.failedTitle", "checkout.state.failedEm")}
          </h1>
          <p className={stateIntro}>
            {cancelled
              ? t("checkout.telr.cancelledRetryBody")
              : declined
                ? t("checkout.state.declinedBody")
                : t("checkout.telr.failedBody")}
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
              <span>{t("tryAgain")}</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
            <LocaleLink className={checkoutLink} href="/">
              {t("checkout.state.returnHome")}
            </LocaleLink>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  // hint-only (no order in storage, or declined/cancelled without platform Paid)
  const resultHint = outcome.hint;
  const copy = hintCopy(resultHint, t);
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
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
              {t("checkout.telr.noLocalOrder")}
            </h2>
            <p>{t("checkout.state.noOrderBody")}</p>
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
                  ? t("checkout.state.orderStatus")
                  : t("tryAgain")}
              </span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          ) : (
            <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
              <span>{t("checkout.state.returnHome")}</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          )}
          {orderId ? (
            <LocaleLink className={checkoutLink} href="/">
              {t("checkout.state.returnHome")}
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
  const t = useShopCopy();
  const bits = [
    provider ? t("checkout.telr.meta.provider", { provider }) : null,
    zone ? t("checkout.telr.meta.zone", { zone }) : null,
    paymentTransactionId ? t("checkout.telr.meta.transaction", { id: paymentTransactionId.slice(0, 8) }) : null,
    paymentAttemptId ? t("checkout.telr.meta.attempt", { id: paymentAttemptId.slice(0, 8) }) : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className={checkoutNote}>{bits.join(" · ")}</p>;
}
