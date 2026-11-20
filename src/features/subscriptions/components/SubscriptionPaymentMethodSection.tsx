"use client";

import { useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import { accountPanel, accountPanelBody, accountPrimaryCta } from "@/styles/accountChrome";
import {
  confirmSubscriptionPaymentMethod,
  startSubscriptionPaymentMethod,
} from "../api/subscription.api";
import type { SubscriptionPaymentMethod } from "../types/subscription.types";
import { buildSetupSessionBody, CARD_SETUP_COPY, classifySetupConfirmation, selectTestPublishableKey } from "../utils/cardSetup";
import {
  maskedCardLast4,
  paymentMethodErrorMessage,
  paymentMethodStatusLabel,
} from "../utils/subscriptionManagement";

type Consent = { version: string; text: string };

type Session = {
  instrumentId: string;
  clientSecret: string;
  publishableKey: string;
};

type Props = {
  subscriptionId: string;
  zoneCode: string;
  paymentMethod?: SubscriptionPaymentMethod | null;
  canReplace: boolean;
  consent: Consent | null;
  returnPath: string;
  onSaved: () => Promise<void>;
  embedded?: boolean;
  nextChargeLabel?: string | null;
};

function ReplacementCardForm({
  session,
  returnPath,
  busy,
  onConfirm,
  onMessage,
}: {
  session: Session;
  returnPath: string;
  busy: boolean;
  onConfirm: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const t = useShopCopy();
  const stripe = useStripe();
  const elements = useElements();
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!stripe || !elements || submitting.current || busy) return;
    submitting.current = true;
    setSaving(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        clientSecret: session.clientSecret,
        redirect: "if_required",
        confirmParams: { return_url: `${window.location.origin}${returnPath}` },
      });
      const phase = classifySetupConfirmation(result);
      if (phase !== "webhook_pending") {
        onMessage(t(CARD_SETUP_COPY[phase]));
        return;
      }
      await onConfirm();
    } catch (err) {
      onMessage(paymentMethodErrorMessage(err, t));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <PaymentElement />
      <button
        type="button"
        className={`${accountPrimaryCta} max-[599px]:w-full disabled:opacity-60`}
        disabled={!stripe || !elements || saving || busy}
        onClick={() => void confirm()}
      >
        {saving ? t("subs.card.saving") : t("subs.card.saveReplacement")}
      </button>
    </div>
  );
}

export function SubscriptionPaymentMethodSection({
  subscriptionId,
  zoneCode,
  paymentMethod,
  canReplace,
  consent,
  returnPath,
  onSaved,
  embedded = false,
  nextChargeLabel = null,
}: Props) {
  const t = useShopCopy();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const last4 = maskedCardLast4(paymentMethod?.last4);
  const stripePromise = useMemo(
    () => (session ? getStripe(session.publishableKey) : null),
    [session],
  );

  async function start() {
    if (!consent) return;
    const body = buildSetupSessionBody({
      zoneCode,
      consentTextVersion: consent.version,
      recurringUseAccepted: accepted,
    });
    if (!body || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const created = await startSubscriptionPaymentMethod(subscriptionId, body);
      const publishableKey = selectTestPublishableKey(created.publishableKey);
      if (!created.instrumentId || !created.clientSecret || !publishableKey) {
        setMessage(t(CARD_SETUP_COPY.unavailable));
        return;
      }
      setSession({
        instrumentId: created.instrumentId,
        clientSecret: created.clientSecret,
        publishableKey,
      });
    } catch (err) {
      setMessage(paymentMethodErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReplacement() {
    if (!session) return;
    setBusy(true);
    setMessage(null);
    try {
      await confirmSubscriptionPaymentMethod(subscriptionId, {
        zoneCode,
        instrumentId: session.instrumentId,
      });
      await onSaved();
      setSession(null);
      setOpen(false);
      setAccepted(false);
    } catch (err) {
      setMessage(paymentMethodErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  const cardSummary = paymentMethod ? (
    <p className="m-0 text-[0.9rem]">
      {paymentMethod.brand?.trim() || t("subs.card.card")}
      {last4 ? ` · ${last4}` : ""}
      {paymentMethod.expiryMonth && paymentMethod.expiryYear
        ? ` · ${t("subs.card.expires", { expiry: `${paymentMethod.expiryMonth}/${paymentMethod.expiryYear}` })}`
        : ""}
      {` · ${paymentMethodStatusLabel(paymentMethod.status, t)}`}
    </p>
  ) : (
    <p className="m-0 text-[0.9rem]">{t("subs.card.none")}</p>
  );
  const changeButton = canReplace && !open && !session ? (
    <button
      type="button"
      aria-label={t("subs.card.change")}
      className={embedded ? "text-sm font-semibold text-[#8E4636]" : `${accountPrimaryCta} w-fit max-[599px]:w-full`}
      onClick={() => setOpen(true)}
    >
      {embedded ? t("subs.card.changeShort") : t("subs.card.change")}
    </button>
  ) : null;

  const setup = (
    <>
      {open && !session ? (
        <div className="flex flex-col gap-3">
          {consent ? <p className="m-0 text-[0.9rem]">{consent.text}</p> : (
            <p className="m-0 text-[0.9rem]" role="status">
              {t("subs.card.consentMissing")}
            </p>
          )}
          <label className="flex items-start gap-2 text-[0.9rem]">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              disabled={!consent || busy}
            />
            <span>{t("subs.card.accept")}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${accountPrimaryCta} max-[599px]:w-full disabled:opacity-60`}
              disabled={!accepted || !consent || busy}
              onClick={() => void start()}
            >
              {busy ? t("subs.cardSetup.starting") : t("subs.cardSetup.continue")}
            </button>
            <button type="button" className="h-11 underline" disabled={busy} onClick={() => setOpen(false)}>
              {t("subs.card.keep")}
            </button>
          </div>
        </div>
      ) : null}
      {session && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret: session.clientSecret }}>
          <ReplacementCardForm
            session={session}
            returnPath={returnPath}
            busy={busy}
            onMessage={setMessage}
            onConfirm={confirmReplacement}
          />
        </Elements>
      ) : null}
      {message ? (
        <p className="m-0 text-[0.9rem]" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-[#F8F4EC] px-3.5 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-[#8E4636]" aria-hidden="true">▭</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{paymentMethod?.brand?.trim() || t("subs.card.card")}{last4 ? ` · ${last4}` : ""}</div>
            {nextChargeLabel ? <div className="text-xs text-[#6E5A50]">{nextChargeLabel}</div> : cardSummary}
          </div>
          {changeButton}
        </div>
        {setup}
      </div>
    );
  }

  return (
    <section className={accountPanel} aria-labelledby="subscription-payment-method">
      <div className={`${accountPanelBody} flex flex-col gap-3`}>
        <h2 id="subscription-payment-method" className="m-0 text-[1rem] font-semibold">
          {t("subs.card.title")}
        </h2>
        {cardSummary}
        {changeButton}
        {setup}
      </div>
    </section>
  );
}
