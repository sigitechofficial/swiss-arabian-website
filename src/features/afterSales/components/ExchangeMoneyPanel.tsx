"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useHydrated } from "@/hooks/useHydrated";
import { ApiClientError } from "@/lib/api/apiError";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { afterSalesKeys } from "../api/afterSales.keys";
import {
  requestCustomerDifferencePayment,
  requestGuestDifferencePayment,
  syncCustomerDifferencePayment,
  syncGuestDifferencePayment,
} from "../api/afterSales.service";
import type { ExchangeMoneyView } from "../types/afterSales";
import {
  EXCHANGE_PAYMENT_PARAM,
  exchangeMoneyCopy,
  exchangePaymentReturnUrl,
  isReturningFromExchangePayment,
} from "../utils/exchangeMoney";

type GuestProof = { orderNumber: string; orderAccessToken: string };

const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 2500;

type Phase =
  | { kind: "idle" }
  | { kind: "opening" }
  | { kind: "confirming" }
  | { kind: "unconfirmed" }
  | { kind: "error"; message: string };

/**
 * Money side of an exchange, driven by the backend's `money.action`:
 * pay the price difference (hosted checkout — Stripe, Paymob, Telr or Tabby),
 * or see the status of a difference refund. Never shows Pay when a refund is due.
 *
 * Paying leaves the site and comes back to this same page with
 * `?exchangePayment=<id>`; the panel then asks the backend (which asks the
 * payment provider) until the payment is settled. The return link itself is
 * never treated as proof of payment.
 */
export function ExchangeMoneyPanel({
  exchangeRequestId,
  money,
  guest,
}: {
  exchangeRequestId: string;
  money: ExchangeMoneyView | null | undefined;
  /** Guest order proof; omit for a signed-in customer. */
  guest?: GuestProof;
}) {
  const queryClient = useQueryClient();
  const t = useShopCopy();
  const hydrated = useHydrated();
  const [fresh, setFresh] = useState<ExchangeMoneyView | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const polled = useRef(false);
  const guestOrderNumber = guest?.orderNumber;
  const guestToken = guest?.orderAccessToken;

  const view = fresh ?? money ?? null;
  const returning = hydrated && isReturningFromExchangePayment(exchangeRequestId, window.location.search);

  // Back from the payment page: confirm with the backend, then tidy the address.
  useEffect(() => {
    if (!returning || polled.current) return;
    polled.current = true;
    let cancelled = false;
    void (async () => {
      setPhase({ kind: "confirming" });
      let settled = false;
      for (let attempt = 0; attempt < POLL_ATTEMPTS && !cancelled; attempt++) {
        try {
          const res =
            guestOrderNumber && guestToken
              ? await syncGuestDifferencePayment(guestOrderNumber, exchangeRequestId, guestToken)
              : await syncCustomerDifferencePayment(exchangeRequestId);
          if (cancelled) return;
          setFresh(res.money);
          if (res.settled) {
            settled = true;
            break;
          }
          // The provider closed the session without payment — stop waiting.
          if (res.money.action === "PAY_DIFFERENCE" && !res.money.customerPayUrl && res.money.payment) break;
        } catch {
          // Transient — keep polling.
        }
        if (attempt < POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, POLL_DELAY_MS));
        }
      }
      if (cancelled) return;
      setPhase(settled ? { kind: "idle" } : { kind: "unconfirmed" });
      const url = new URL(window.location.href);
      url.searchParams.delete(EXCHANGE_PAYMENT_PARAM);
      for (const key of ["result", "payment_id", "paymentTransactionId", "paymentAttemptId", "provider", "zone", "orderId"]) {
        url.searchParams.delete(key);
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      void queryClient.invalidateQueries({ queryKey: afterSalesKeys.all });
    })();
    return () => {
      cancelled = true;
    };
  }, [returning, exchangeRequestId, guestOrderNumber, guestToken, queryClient]);

  if (!view) return null;
  const copy = exchangeMoneyCopy(view, t);
  if (!copy) return null;

  async function pay() {
    if (phase.kind === "opening") return;
    setPhase({ kind: "opening" });
    try {
      const returnUrl = exchangePaymentReturnUrl(exchangeRequestId, window.location);
      const body = { returnUrl, cancelUrl: returnUrl };
      const res =
        guestOrderNumber && guestToken
          ? await requestGuestDifferencePayment(guestOrderNumber, exchangeRequestId, {
              ...body,
              orderAccessToken: guestToken,
            })
          : await requestCustomerDifferencePayment(exchangeRequestId, body);
      setFresh(res.money);
      if (res.settled) {
        setPhase({ kind: "idle" });
        void queryClient.invalidateQueries({ queryKey: afterSalesKeys.all });
        return;
      }
      if (res.customerPayUrl) {
        // Hosted payment page on another origin — a full navigation, same window.
        window.location.assign(res.customerPayUrl);
        return;
      }
      setPhase({
        kind: "error",
        message: t("exchangeMoney.notReady"),
      });
    } catch (e) {
      setPhase({
        kind: "error",
        message:
          e instanceof ApiClientError && e.message
            ? e.message
            : t("exchangeMoney.openFailed"),
      });
    }
  }

  const amount = copy.amount ? formatMoney(Number(copy.amount), view.currencyCode) : null;

  return (
    <div className="mt-3 border-t border-sa-border pt-3 text-[13px]" data-exchange-money={view.action}>
      <p className="font-semibold text-sa-primary">
        {copy.title}
        {amount ? <span dir="ltr">{` ${amount}`}</span> : null}
      </p>
      {phase.kind === "confirming" ? (
        <p className="mt-1 text-sa-muted" role="status">
          {t("exchangeMoney.confirming")}
        </p>
      ) : (
        <p className="mt-1 leading-relaxed text-sa-muted">{copy.body}</p>
      )}
      {phase.kind === "unconfirmed" && copy.canPay ? (
        <p className="mt-1 leading-relaxed text-sa-muted" role="status">
          {t("exchangeMoney.unconfirmed")}
        </p>
      ) : null}
      {phase.kind === "error" ? (
        <p className="mt-1 leading-relaxed text-red-700" role="alert">
          {phase.message}
        </p>
      ) : null}
      {copy.canPay && phase.kind !== "confirming" ? (
        <button
          type="button"
          className="mt-2 rounded-full bg-terra px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          onClick={() => void pay()}
          disabled={phase.kind === "opening"}
        >
          {phase.kind === "opening" ? t("exchangeMoney.opening") : amount ? t("exchangeMoney.payAmount", { amount }) : t("exchangeMoney.payDifference")}
        </button>
      ) : null}
    </div>
  );
}
