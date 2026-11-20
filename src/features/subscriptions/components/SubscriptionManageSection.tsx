"use client";

import { useRef, useState } from "react";

import { accountPrimaryCta, orderCancelConfirm, orderNotice, orderNoticeTone } from "@/styles/accountChrome";
import type { SubscriptionManagementActions } from "../types/subscription.types";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/** Message key: a renewal charge is already on its way. */
export const RENEWAL_CHARGE_PENDING_WARNING: MessageKey = "subs.manage.renewalPending";

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
  const t = useShopCopy();
  const locale = useShopLocale();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [skipKey, setSkipKey] = useState<string | null>(null);
  const submitting = useRef(false);
  const timeZone = useMarketTimeZone();
  // Same date format as the shopper's orders (the page's language, the market's time zone).
  const pausedDate = pausedAt ? formatOrderDate(pausedAt, { long: true, timeZone, locale }) || null : null;

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
          {t("subs.manage.title")}
        </h2>
        {status === "PAUSED" ? (
          <p className="m-0 text-[0.9rem]">
            {pausedDate ? t("subs.manage.pausedOn", { date: pausedDate }) : t("subs.manage.paused")}
          </p>
        ) : null}
        {renewalChargePending ? (
          <p className={`${orderNotice} ${orderNoticeTone.error}`} role="status">
            {t(RENEWAL_CHARGE_PENDING_WARNING)}
          </p>
        ) : null}
        {pending === "pause" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              {t("subs.manage.pauseConfirmText")}
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              {t("subs.manage.confirmPause")}
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              {t("subs.manage.keep")}
            </button>
          </div>
        ) : null}
        {pending === "resume" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              {t("subs.manage.resumeConfirmText")}
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              {t("subs.manage.confirmResume")}
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              {t("subs.manage.stayPaused")}
            </button>
          </div>
        ) : null}
        {pending === "skip" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              {t("subs.manage.skipConfirmText")}
            </p>
            <button type="button" className={`mt-3 ${buttonClass}`} disabled={busy} onClick={() => void confirm()}>
              {t("subs.manage.confirmSkip")}
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              {t("subs.manage.keepNextMonth")}
            </button>
          </div>
        ) : null}
        {pending === "cancel" ? (
          <div>
            <p className="m-0 text-[0.9rem]">
              {t("subs.manage.cancelConfirmText")}
            </p>
            <button type="button" className={`mt-3 ${orderCancelConfirm}`} disabled={busy} onClick={() => void confirm()}>
              {t("subs.detail.confirmCancel")}
            </button>
            <button type="button" className="ms-3 h-11 underline" disabled={busy} onClick={() => setPending(null)}>
              {t("subs.manage.keep")}
            </button>
          </div>
        ) : null}
        {pending ? null : (
          <div className="flex flex-col">
            {actions?.canSkip ? (
              <ManageRow label={t("subs.manage.skip")} name={t("subs.manage.skipName")} disabled={busy} onClick={() => ask("skip")} />
            ) : null}
            {actions?.canPause ? (
              <ManageRow label={t("subs.manage.pause")} name={t("subs.manage.pauseName")} disabled={busy} onClick={() => ask("pause")} />
            ) : null}
            {actions?.canResume ? (
              <ManageRow label={t("subs.manage.resume")} name={t("subs.manage.resumeName")} disabled={busy} onClick={() => ask("resume")} />
            ) : null}
            {actions?.canCancel ? (
              <ManageRow label={t("subs.manage.cancel")} name={t("subs.manage.cancelName")} disabled={busy} danger onClick={() => ask("cancel")} />
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
