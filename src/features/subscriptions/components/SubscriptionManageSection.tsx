"use client";

import { useRef, useState } from "react";

import { accountPrimaryCta, orderCancelConfirm, orderNotice, orderNoticeTone } from "@/styles/accountChrome";
import type { SubscriptionManagementActions } from "../types/subscription.types";

export const RENEWAL_CHARGE_PENDING_WARNING =
  "A renewal payment is already in progress. This action will not reverse a charge that has already been submitted.";

const buttonClass = `${accountPrimaryCta} disabled:opacity-60`;

function newSkipKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `skip-${Date.now()}`;
}

type PendingAction = "pause" | "resume" | "skip" | "cancel";

type Props = {
  actions?: SubscriptionManagementActions | null;
  status: string;
  pausedAt?: string | null;
  renewalChargePending?: boolean;
  busy: boolean;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onSkip: (idempotencyKey: string) => Promise<void>;
  onCancel: () => Promise<void>;
};

export function SubscriptionManageSection({
  actions,
  status,
  pausedAt,
  renewalChargePending,
  busy,
  onPause,
  onResume,
  onSkip,
  onCancel,
}: Props) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [skipKey, setSkipKey] = useState<string | null>(null);
  const submitting = useRef(false);
  const pausedDate = pausedAt
    ? new Date(pausedAt).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })
    : null;

  function ask(action: PendingAction) {
    setPending(action);
  }

  async function confirm() {
    if (!pending || busy || submitting.current) return;
    submitting.current = true;
    try {
      if (pending === "pause") await onPause();
      if (pending === "resume") await onResume();
      if (pending === "skip") {
        const key = skipKey ?? newSkipKey();
        setSkipKey(key);
        await onSkip(key);
        setSkipKey(null);
      }
      if (pending === "cancel") await onCancel();
      setPending(null);
    } catch {
      // The page shows the backend message. A failed skip keeps its Idempotency-Key.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6DCCB] bg-white p-[22px]" aria-labelledby="manage-subscription">
      <div className="flex flex-col gap-3">
        <h2 id="manage-subscription" className="m-0 text-lg font-semibold">
          Manage
        </h2>
        {status === "PAUSED" ? (
          <p className="m-0 text-[0.9rem]">
            Paused{pausedDate ? ` ${pausedDate}` : ""}.
          </p>
        ) : null}
        {renewalChargePending ? (
          <p className={`${orderNotice} ${orderNoticeTone.error}`} role="status">
            {RENEWAL_CHARGE_PENDING_WARNING}
          </p>
        ) : null}
        {pending === "pause" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              Pause this subscription? Future renewals will pause. Orders that are already paid stay as they are.
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              Confirm pause
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              Keep subscription
            </button>
          </div>
        ) : null}
        {pending === "resume" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              Resume this subscription? Resuming does not charge you now. The next billing date shown after this
              request is the date returned by your account.
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              Confirm resume
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              Stay paused
            </button>
          </div>
        ) : null}
        {pending === "skip" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              Skip the next month? One upcoming monthly slot will be used. That skipped month is not charged and no
              order is created for it.
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              Confirm skip
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              Keep next month
            </button>
          </div>
        ) : null}
        {pending === "cancel" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              Cancel this subscription? Cancellation stops future eligible renewals. It does not refund or cancel
              orders that are already paid. This cannot be undone. A new subscription is required to subscribe again.
            </p>
            <button type="button" className={`mt-3 ${orderCancelConfirm}`} disabled={busy} onClick={() => void confirm()}>
              Confirm cancellation
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              Keep subscription
            </button>
          </div>
        ) : null}
        {pending ? null : (
          <div className="flex flex-col">
            {actions?.canSkip ? (
              <ManageRow label="Skip next month" name="Skip Next Month" disabled={busy} onClick={() => ask("skip")} />
            ) : null}
            {actions?.canPause ? (
              <ManageRow label="Pause subscription" name="Pause Subscription" disabled={busy} onClick={() => ask("pause")} />
            ) : null}
            {actions?.canResume ? (
              <ManageRow label="Resume subscription" name="Resume Subscription" disabled={busy} onClick={() => ask("resume")} />
            ) : null}
            {actions?.canCancel ? (
              <ManageRow label="Cancel subscription" name="Cancel Subscription" disabled={busy} danger onClick={() => ask("cancel")} />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function ManageRow({
  label,
  name,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  name: string;
  danger?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between border-t border-[#EDE4D6] py-3.5 text-left text-[15px] first:border-t-0 disabled:opacity-60 ${danger ? "text-[#8E4636]" : "text-[#2B1D17]"}`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-[#B9A68F]">›</span>
    </button>
  );
}
