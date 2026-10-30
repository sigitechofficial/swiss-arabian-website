"use client";

import { useEffect, useRef, useState } from "react";
import {
  checkoutCta,
  checkoutError,
  checkoutLegal,
  checkoutLink,
  payMockNote,
  payOptBadge,
  payOptNote,
  payOptTitle,
} from "@/styles/checkoutChrome";
import type { CheckoutStatus } from "../../hooks/useCheckout";
import type { PaymentMethodOption } from "../../types/checkout";
import type { InlinePaymentSession } from "../../utils/startPayment";
import { isStripePaymentMethod, paymentMethodNote, upcomingPaymentMethods } from "../../utils/methodLabels";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { InlineMethodPayment, type PaymentSurface } from "./InlineMethodPayment";

type CheckoutPaymentProps = {
  methods: PaymentMethodOption[];
  countryCode?: string | null;
  selectedId: string | null;
  status: CheckoutStatus;
  submitting: boolean;
  errorMsg: string | null;
  onRetry: () => void;
  onSelect: (id: string) => void | Promise<void>;
  canSubmit: boolean;
  ctaLabel: string;
  amountPayable?: number | null;
  currency?: string;
  inlinePayment?: InlinePaymentSession | null;
  onPayNow?: () => void;
};

export function CheckoutPayment({
  methods,
  countryCode,
  selectedId,
  status,
  submitting,
  errorMsg,
  onRetry,
  onSelect,
  canSubmit,
  ctaLabel,
  amountPayable,
  currency = "AED",
  inlinePayment = null,
  onPayNow = () => undefined,
}: CheckoutPaymentProps) {
  const covered = amountPayable === 0;
  const [openingPay, setOpeningPay] = useState(false);
  const opening = useRef(false);
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const groups = paymentGroups(methods, countryCode);
  const rows = groups.flatMap((group) => group.rows);
  const selected = methods.find((method) => method.zonePaymentMethodId === selectedId) ?? null;
  const fallbackKey = selected ? defaultRowKey(selected) : null;
  const activeKey = rows.some((row) => row.key === optionKey) ? optionKey : fallbackKey;
  const activeRow = rows.find((row) => row.key === activeKey) ?? null;
  const selectedOpensHere = Boolean(activeRow?.surface);

  useEffect(() => {
    if (!submitting && !inlinePayment) {
      opening.current = false;
      setOpeningPay(false);
    }
  }, [submitting, inlinePayment]);

  function payNow() {
    if (submitting || opening.current) return;
    opening.current = true;
    onPayNow();
    window.setTimeout(() => {
      opening.current = false;
    }, 0);
  }

  function pick(row: PayRow) {
    if (row.disabled) return;
    setOptionKey(row.key);
    if (row.zoneId && row.zoneId !== selectedId) void onSelect(row.zoneId);
  }

  const payLabel = submitting
    ? "Placing order…"
    : activeRow?.surface === "apple_pay"
      ? "Pay with Apple Pay"
      : activeRow?.surface === "google_pay"
        ? "Pay with Google Pay"
        : `Pay ${formatMoney(amountPayable, currency)}`;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[0.82rem] font-medium tracking-[0.02em] text-[var(--ink,#241f1b)] uppercase">
            Payment
          </h2>
          <p className="mt-1 mb-0 text-[0.82rem] text-[var(--ink-2,#5b5148)]">All transactions are secure and encrypted.</p>
        </div>
        {covered ? (
          <p className={payMockNote}>No payment needed — your rewards cover this order.</p>
        ) : (
          <>
            <div className="grid gap-5" role="radiogroup" aria-label="Payment method">
              {groups.map((group) => (
                <div key={group.id}>
                  {group.title ? (
                    <h3 className="m-0 mb-2 text-[0.95rem] font-semibold text-[var(--ink,#241f1b)]">{group.title}</h3>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border border-[#d3d8df] bg-white">
                    {group.rows.map((row) => {
                      const on = row.key === activeKey;
                      const dropReady =
                        on &&
                        row.surface &&
                        inlinePayment &&
                        ((row.provider === "stripe" && inlinePayment.provider === "stripe") ||
                          (row.provider === "paymob" && inlinePayment.provider === "paymob"));
                      return (
                        <div key={row.key} className={`border-t border-[#d3d8df] first:border-t-0 ${row.disabled ? "opacity-55" : ""}`}>
                          <label className={`flex min-h-14 items-center gap-3 px-4 py-3.5 ${row.disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            <input
                              type="radio"
                              name="payMethod"
                              value={row.key}
                              checked={on}
                              disabled={submitting || row.disabled}
                              onChange={() => pick(row)}
                              className="size-[18px] accent-copper"
                            />
                            {row.wallet ? <WalletMark kind={row.wallet} /> : null}
                            <span className="min-w-0 flex-1">
                              <span className={payOptTitle}>{row.title}</span>
                              {row.sub ? <span className={payOptNote}>{row.sub}</span> : null}
                            </span>
                            {row.marks ? <BrandMarks marks={row.marks} /> : null}
                            {row.badge ? <span className={payOptBadge}>{row.badge}</span> : null}
                          </label>
                          {on && row.surface ? (
                            <div className="px-4 pb-4 ps-12">
                              {dropReady ? (
                                <InlineMethodPayment session={inlinePayment} surface={row.surface} />
                              ) : (
                                <p className={payMockNote}>Loading secure card form…</p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {!methods.length ? (
              <p className={payMockNote}>
                {status === "loading" ? "Loading payment options…" : "No payment options are available right now."}
              </p>
            ) : null}
            {selectedOpensHere ? (
              <button type="button" className={checkoutCta} disabled={!canSubmit || submitting} onClick={payNow}>
                <span>{payLabel}</span>
              </button>
            ) : null}
          </>
        )}
      </div>

      {errorMsg ? (
        <p className={checkoutError} role="alert">
          {errorMsg}
          {status === "error" ? (
            <>
              {" "}
              <button type="button" className={checkoutLink} onClick={onRetry}>
                Try again
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <button type="submit" className={checkoutCta} id="place-order" disabled={!canSubmit || openingPay} hidden={Boolean(inlinePayment) || selectedOpensHere}>
        <span>{ctaLabel}</span>
        <b aria-hidden="true">↗</b>
      </button>
      <p className={checkoutLegal}>
        By placing this order you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>. Payment is
        encrypted.
      </p>
    </>
  );
}

type PayMark = "visa" | "mc" | "amex";

type PayRow = {
  key: string;
  title: string;
  sub?: string;
  marks?: PayMark[];
  wallet?: "apple" | "google";
  badge?: string;
  disabled?: boolean;
  zoneId?: string;
  surface?: PaymentSurface;
  provider?: "stripe" | "paymob";
};

function paymentGroups(methods: PaymentMethodOption[], countryCode?: string | null): Array<{ id: string; title: string | null; rows: PayRow[] }> {
  const country = (countryCode || "AE").toUpperCase();
  const stripeFirst = !["SA", "EG", "PK"].includes(country);
  const stripe = methods.find((method) => isStripePaymentMethod(method));
  const paymob = methods.find((method) => method.providerCode?.toLowerCase() === "paymob");
  const used = new Set([stripe?.zonePaymentMethodId, paymob?.zonePaymentMethodId].filter(Boolean));
  const groups: Array<{ id: string; title: string | null; rows: PayRow[] }> = [];

  const stripeGroup = stripe
    ? {
        id: "stripe",
        title: "Stripe",
        rows: [
          { key: "apple_pay@stripe", title: "Apple Pay", wallet: "apple", zoneId: stripe.zonePaymentMethodId, surface: "apple_pay" as const, provider: "stripe" as const },
          { key: "google_pay@stripe", title: "Google Pay", wallet: "google", zoneId: stripe.zonePaymentMethodId, surface: "google_pay" as const, provider: "stripe" as const },
          { key: "card@stripe", title: "Credit or debit card", sub: "Visa, Mastercard, Amex", marks: ["visa", "mc", "amex"] as PayMark[], zoneId: stripe.zonePaymentMethodId, surface: "card" as const, provider: "stripe" as const },
        ],
      }
    : null;
  const paymobGroup = paymob
    ? {
        id: "paymob",
        title: "Paymob",
        rows: [
          { key: "card@paymob", title: "Credit or debit card", sub: "Visa, Mastercard", marks: ["visa", "mc"] as PayMark[], zoneId: paymob.zonePaymentMethodId, surface: "card" as const, provider: "paymob" as const },
        ],
      }
    : null;

  for (const group of stripeFirst ? [stripeGroup, paymobGroup] : [paymobGroup, stripeGroup]) {
    if (group) groups.push(group);
  }

  const others = methods.filter((method) => !used.has(method.zonePaymentMethodId));
  if (others.length) {
    groups.push({
      id: "other",
      title: "Other",
      rows: others.map((method) => ({
        key: method.zonePaymentMethodId,
        title: method.displayName,
        sub: paymentMethodNote(method) || undefined,
        zoneId: method.zonePaymentMethodId,
      })),
    });
  }

  const more = (methods.length ? upcomingPaymentMethods(countryCode, methods) : []).filter(
    (method) => method.selectsProvider !== "stripe" && method.id !== "paymob-apple-pay" && method.id !== "paymob-google-pay",
  );
  if (more.length) {
    groups.push({
      id: "more",
      title: "More ways to pay",
      rows: more.map((method) => ({
        key: method.id,
        title: method.title,
        sub: method.note,
        badge: "Coming soon",
        disabled: true,
      })),
    });
  }

  return groups;
}

function defaultRowKey(method: PaymentMethodOption): string {
  if (isStripePaymentMethod(method)) return "card@stripe";
  if (method.providerCode?.toLowerCase() === "paymob") return "card@paymob";
  return method.zonePaymentMethodId;
}

function WalletMark({ kind }: { kind: "apple" | "google" }) {
  if (kind === "apple") {
    return (
      <span className="grid size-6 shrink-0 place-items-center text-[#111]" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.4-3.7zM14.6 6.6c.6-.8 1.1-1.8 1-2.8-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.5z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="grid size-6 shrink-0 place-items-center" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
        <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
        <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z" />
      </svg>
    </span>
  );
}

function BrandMarks({ marks }: { marks: PayMark[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {marks.includes("visa") ? (
        <span className="grid h-5 min-w-8 place-items-center rounded-[3px] border border-[#1a1f71] bg-white px-1 text-[0.55rem] font-bold tracking-wide text-[#1a1f71]">VISA</span>
      ) : null}
      {marks.includes("mc") ? (
        <span className="grid h-5 w-7 place-items-center rounded-[3px] border border-[#e4e0d8] bg-white">
          <svg width="16" height="10" viewBox="0 0 16 10">
            <circle cx="6" cy="5" r="4" fill="#eb001b" />
            <circle cx="10" cy="5" r="4" fill="#f79e1b" />
            <path d="M8 2.2a4 4 0 0 1 0 5.6 4 4 0 0 1 0-5.6z" fill="#ff5f00" />
          </svg>
        </span>
      ) : null}
      {marks.includes("amex") ? (
        <span className="grid h-5 min-w-8 place-items-center rounded-[3px] border border-[#2e77bc] bg-white px-1 text-[0.5rem] font-bold tracking-wide text-[#2e77bc]">AMEX</span>
      ) : null}
    </span>
  );
}
