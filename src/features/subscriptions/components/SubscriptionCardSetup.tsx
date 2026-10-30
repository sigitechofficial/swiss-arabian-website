"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";

import { accountPanel, accountPanelBody, accountPrimaryCta } from "@/styles/accountChrome";

import { createSetupSession, listPaymentInstruments } from "../api/paymentInstrument.api";
import { readFirstPayment, startFirstPayment } from "../api/subscription.api";
import {
  CARD_SETUP_COPY,
  buildSetupSessionBody,
  classifySetupConfirmation,
  instrumentActivation,
  selectTestPublishableKey,
  setupIntentIdFromClientSecret,
  setupReturnPhase,
  type CardSetupPhase,
} from "../utils/cardSetup";
import { firstPaymentMessage, reusableInstrument, settleFirstPayment } from "../utils/firstPayment";

const REMEMBER_PREFIX = "scent-club-setup:";

type Props = {
  zoneCode: string;
  consentVersion: string;
  consentText: string;
  returnPath: string;
  subscriptionId?: string;
};

type Session = {
  instrumentId: string;
  clientSecret: string;
  publishableKey: string;
};

function rememberedInstrument(setupIntentId: string | null): string | null {
  if (!setupIntentId || typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(`${REMEMBER_PREFIX}${setupIntentId}`);
}

function rememberInstrument(setupIntentId: string, instrumentId: string) {
  sessionStorage.setItem(`${REMEMBER_PREFIX}${setupIntentId}`, instrumentId);
}

async function waitForInstrument(zoneCode: string, instrumentId: string): Promise<"active" | "webhook_pending"> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const items = await listPaymentInstruments(zoneCode);
    if (instrumentActivation(items, instrumentId) === "ACTIVE") return "active";
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return "webhook_pending";
}

function CardConfirm({
  zoneCode,
  clientSecret,
  returnPath,
  onPhase,
  paying,
}: {
  zoneCode: string;
  clientSecret: string;
  returnPath: string;
  paying: boolean;
  onPhase: (phase: CardSetupPhase | "active", instrumentId: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function confirm() {
    if (!stripe || !elements) return;
    setBusy(true);
    const result = await stripe.confirmSetup({
      elements,
      clientSecret,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}${returnPath}` },
    });
    const phase = classifySetupConfirmation(result);
    const setupIntentId = setupIntentIdFromClientSecret(clientSecret);
    const instrumentId = rememberedInstrument(setupIntentId);
    if (mounted.current) onPhase(phase, instrumentId);
    if ((phase === "webhook_pending" || phase === "processing") && instrumentId) {
      const settled = await waitForInstrument(zoneCode, instrumentId);
      if (mounted.current && settled === "active") onPhase("active", instrumentId);
    }
    if (mounted.current) setBusy(false);
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <PaymentElement />
      <button type="button" className={accountPrimaryCta} disabled={!stripe || !elements || busy || paying} onClick={() => void confirm()}>
        {busy ? "Saving card…" : "Save card"}
      </button>
    </div>
  );
}

export function SubscriptionCardSetup({ zoneCode, consentVersion, consentText, returnPath, subscriptionId }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [usingSavedCard, setUsingSavedCard] = useState(false);
  const paymentStarted = useRef(false);
  const [returned] = useState(() => setupReturnPhase(typeof window === "undefined" ? "" : window.location.search));

  const confirmPaymentAction = useCallback(async (clientSecret: string) => {
    const storedKey = subscriptionId ? sessionStorage.getItem(`${REMEMBER_PREFIX}pk:${subscriptionId}`) : null;
    const key = selectTestPublishableKey(session?.publishableKey || storedKey);
    if (!key) return;
    const stripe = await getStripe(key);
    if (!stripe) return;
    await stripe.confirmCardPayment(clientSecret);
  }, [session?.publishableKey, subscriptionId]);

  const payWithInstrument = useCallback(async (instrumentId: string) => {
    if (!subscriptionId || paymentStarted.current) return;
    paymentStarted.current = true;
    setUsingSavedCard(true);
    setPaying(true);
    try {
      const view = await settleFirstPayment({
        subscriptionId,
        zoneCode,
        paymentInstrumentId: instrumentId,
        read: readFirstPayment,
        start: startFirstPayment,
        confirmAction: confirmPaymentAction,
      });
      setMessage(firstPaymentMessage(view));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "The subscription payment could not be confirmed.");
    } finally {
      setPaying(false);
    }
  }, [confirmPaymentAction, subscriptionId, zoneCode]);

  useEffect(() => {
    if (!subscriptionId) return;
    let cancelled = false;
    void (async () => {
      const items = await listPaymentInstruments(zoneCode);
      const preferred = sessionStorage.getItem(`${REMEMBER_PREFIX}agreement:${subscriptionId}`);
      const instrumentId = reusableInstrument(items, preferred);
      if (!cancelled && instrumentId) await payWithInstrument(instrumentId);
    })();
    return () => {
      cancelled = true;
    };
  }, [payWithInstrument, subscriptionId, zoneCode]);

  useEffect(() => {
    if (returned !== "webhook_pending" && returned !== "processing") return;
    const setupIntentId = new URLSearchParams(window.location.search).get("setup_intent");
    const instrumentId = rememberedInstrument(setupIntentId);
    if (!instrumentId) return;
    let cancelled = false;
    void waitForInstrument(zoneCode, instrumentId).then((settled) => {
      if (!cancelled) setMessage(CARD_SETUP_COPY[settled === "active" ? "active" : returned]);
    });
    return () => {
      cancelled = true;
    };
  }, [returned, zoneCode]);

  async function start() {
    const body = buildSetupSessionBody({
      zoneCode,
      consentTextVersion: consentVersion,
      recurringUseAccepted: accepted,
    });
    if (!body) return;
    setBusy(true);
    setMessage(null);
    try {
      const created = await createSetupSession(body);
      const publishableKey = selectTestPublishableKey(created.publishableKey);
      const setupIntentId = setupIntentIdFromClientSecret(created.clientSecret);
      if (created.status !== "PENDING_SETUP" || !publishableKey || !setupIntentId || !created.clientSecret) {
        setMessage(CARD_SETUP_COPY.unavailable);
        return;
      }
      rememberInstrument(setupIntentId, created.instrumentId);
      if (subscriptionId) {
        sessionStorage.setItem(`${REMEMBER_PREFIX}agreement:${subscriptionId}`, created.instrumentId);
        sessionStorage.setItem(`${REMEMBER_PREFIX}pk:${subscriptionId}`, publishableKey);
      }
      setSession({ instrumentId: created.instrumentId, clientSecret: created.clientSecret, publishableKey });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : CARD_SETUP_COPY.declined);
    } finally {
      setBusy(false);
    }
  }

  const stripePromise = useMemo(
    () => (session ? getStripe(session.publishableKey) : null),
    [session],
  );

  return (
    <div className={`${accountPanel} mt-4`}>
      <div className={accountPanelBody}>
        <h2 className="m-0 text-[1rem] font-semibold">Authorize a saved card</h2>
        <p className="mt-2 text-[0.9rem]">
          Confirm this card to pay the saved monthly total. No order is placed from this page.
        </p>
        <p className="mt-3 text-[0.9rem]">{consentText}</p>
        {returned && !session ? (
          <p className="mt-3" role="status">
            {CARD_SETUP_COPY[returned]}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3" role="status">
            {message}
          </p>
        ) : null}
        {!session && !usingSavedCard ? (
          <>
            <label className="mt-4 flex items-start gap-2 text-[0.9rem]">
              <input
                type="checkbox"
                className="mt-1"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>I accept recurring card use under agreement {consentVersion}.</span>
            </label>
            <button type="button" className={`${accountPrimaryCta} mt-4`} disabled={!accepted || busy || paying} onClick={() => void start()}>
              {busy ? "Starting card setup…" : "Continue to card"}
            </button>
          </>
        ) : null}
        {session ? (
          <Elements stripe={stripePromise} options={{ clientSecret: session.clientSecret }}>
            <CardConfirm
              zoneCode={zoneCode}
              clientSecret={session.clientSecret}
              returnPath={returnPath}
              paying={paying}
              onPhase={(phase, instrumentId) => {
                if (phase === "active" && instrumentId && subscriptionId) {
                  setMessage("The saved card is active. Starting the subscription payment.");
                  void payWithInstrument(instrumentId);
                  return;
                }
                setMessage(CARD_SETUP_COPY[phase]);
              }}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}
