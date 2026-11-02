"use client";

import { useRef, useState } from "react";

import { accountPanel, accountPanelBody, accountPrimaryCta, orderNotice, orderNoticeTone } from "@/styles/accountChrome";
import type { SubscriptionPaymentRecovery } from "../types/subscription.types";
import { paymentRetryError, recoveryRetryVisible, recoveryStatusLine } from "../utils/subscriptionManagement";

type Props = {
  recovery: SubscriptionPaymentRecovery;
  canReplace: boolean;
  onRetry: () => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function SubscriptionPaymentRecoverySection({ recovery, canReplace, onRetry, onRefresh }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const retryVisible = recoveryRetryVisible(recovery);
  const statusLine = recoveryStatusLine(recovery.status);
  const offerCardChange = canReplace && (recovery.status === "FAILED" || recovery.status === "ACTION_REQUIRED");

  async function confirm() {
    if (!recoveryRetryVisible(recovery) || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await onRetry();
      setConfirming(false);
    } catch (err) {
      const parsed = paymentRetryError(err);
      setError(parsed.message);
      try {
        await onRefresh();
      } catch {
        // The payment request is not sent again. The next attempt waits for a fresh detail response.
      }
      setConfirming(false);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={accountPanel} aria-labelledby="payment-recovery">
      <div className={`${accountPanelBody} flex flex-col gap-3`}>
        <h2 id="payment-recovery" className="m-0 text-[1rem] font-semibold">
          Payment recovery
        </h2>
        {recovery.cycleNumber != null ? (
          <p className="m-0 text-[0.9rem]">Month {recovery.cycleNumber}</p>
        ) : null}
        {statusLine ? <p className="m-0 text-[0.9rem]">{statusLine}</p> : null}
        {recovery.message ? (
          <p
            className={`${orderNotice} ${recovery.status === "FAILED" || recovery.status === "ACTION_REQUIRED" ? orderNoticeTone.error : orderNoticeTone.info}`}
            role="status"
          >
            {recovery.message}
          </p>
        ) : null}
        {offerCardChange ? (
          <p className="m-0 text-[0.9rem]">Change Payment Method is available below before you retry.</p>
        ) : null}
        {confirming && retryVisible ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              Retry this month&apos;s payment? The amount is the one already stored for this subscription.
            </p>
            <button type="button" className={`mt-3 ${accountPrimaryCta} disabled:opacity-60`} disabled={busy} onClick={() => void confirm()}>
              Confirm retry
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setConfirming(false)}>
              Keep this payment
            </button>
          </div>
        ) : null}
        {retryVisible && !confirming ? (
          <button
            type="button"
            className={`${accountPrimaryCta} w-fit max-[599px]:w-full disabled:opacity-60`}
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            Retry Payment
          </button>
        ) : null}
        {error ? (
          <p className="m-0 text-[0.9rem]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
