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

export type ExchangeGuestProof = { orderNumber: string; orderAccessToken: string };

const POLL_ATTEMPTS = 12;
const POLL_DELAY_MS = 2500;
/** Query keys a payment provider adds to the return link. */
const RETURN_PARAMS = ["result", "payment_id", "paymentTransactionId", "paymentAttemptId", "provider", "zone", "orderId"];

export type ExchangeMoneyPhase =
  | { kind: "idle" }
  | { kind: "opening" }
  | { kind: "confirming" }
  | { kind: "unconfirmed" }
  | { kind: "error"; message: string };

/**
 * Money side of an exchange for every brand, driven by the backend's
 * `money.action`: pay the price difference (hosted checkout, any provider),
 * or the status of a difference refund. Never offers Pay when a refund is due.
 *
 * Paying leaves the site and comes back to this page with
 * `?exchangePayment=<id>`; the hook then asks the backend (which asks the
 * payment provider) until the payment is settled. The return link itself is
 * never treated as proof of payment.
 */
export function useExchangeMoney({
  exchangeRequestId,
  money,
  guest,
}: {
  exchangeRequestId: string;
  money: ExchangeMoneyView | null | undefined;
  /** Guest order proof; omit for a signed-in customer. */
  guest?: ExchangeGuestProof;
}) {
  const queryClient = useQueryClient();
  const t = useShopCopy();
  const hydrated = useHydrated();
  const [fresh, setFresh] = useState<ExchangeMoneyView | null>(null);
  const [phase, setPhase] = useState<ExchangeMoneyPhase>({ kind: "idle" });
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
          // The provider closed the session without payment: stop waiting.
          if (res.money.action === "PAY_DIFFERENCE" && !res.money.customerPayUrl && res.money.payment) break;
        } catch {
          // Transient: keep polling.
        }
        if (attempt < POLL_ATTEMPTS - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, POLL_DELAY_MS));
        }
      }
      if (cancelled) return;
      setPhase(settled ? { kind: "idle" } : { kind: "unconfirmed" });
      const url = new URL(window.location.href);
      url.searchParams.delete(EXCHANGE_PAYMENT_PARAM);
      for (const key of RETURN_PARAMS) url.searchParams.delete(key);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      void queryClient.invalidateQueries({ queryKey: afterSalesKeys.all });
    })();
    return () => {
      cancelled = true;
    };
  }, [returning, exchangeRequestId, guestOrderNumber, guestToken, queryClient]);

  async function pay() {
    if (phase.kind === "opening") return;
    setPhase({ kind: "opening" });
    try {
      const returnUrl = exchangePaymentReturnUrl(exchangeRequestId, window.location);
      const body = { returnUrl, cancelUrl: returnUrl };
      const res =
        guestOrderNumber && guestToken
          ? await requestGuestDifferencePayment(guestOrderNumber, exchangeRequestId, { ...body, orderAccessToken: guestToken })
          : await requestCustomerDifferencePayment(exchangeRequestId, body);
      setFresh(res.money);
      if (res.settled) {
        setPhase({ kind: "idle" });
        void queryClient.invalidateQueries({ queryKey: afterSalesKeys.all });
        return;
      }
      if (res.customerPayUrl) {
        // Hosted payment page on another origin: a full navigation, same window.
        window.location.assign(res.customerPayUrl);
        return;
      }
      setPhase({ kind: "error", message: t("exchangeMoney.notReady") });
    } catch (e) {
      setPhase({
        kind: "error",
        message: e instanceof ApiClientError && e.message ? e.message : t("exchangeMoney.openFailed"),
      });
    }
  }

  const copy = view ? exchangeMoneyCopy(view, t) : null;
  if (!view || !copy) return null;
  const offerAdjustment = Number(view.offerAdjustmentAmount ?? 0);
  const offerMoney = offerAdjustment !== 0 ? formatMoney(Math.abs(offerAdjustment), view.currencyCode) : null;
  const amount = copy.amount ? formatMoney(Number(copy.amount), view.currencyCode) : null;

  return {
    action: view.action,
    title: copy.title,
    amount,
    /** What happens next (or "confirming your payment" while it is checked). */
    body: phase.kind === "confirming" ? t("exchangeMoney.confirming") : copy.body,
    confirming: phase.kind === "confirming",
    offerNote: offerMoney
      ? t(offerAdjustment > 0 ? "exchangeMoney.offerAdjusted" : "exchangeMoney.offerCredited", { money: offerMoney })
      : null,
    unconfirmedNote: phase.kind === "unconfirmed" && copy.canPay ? t("exchangeMoney.unconfirmed") : null,
    error: phase.kind === "error" ? phase.message : null,
    canPay: copy.canPay && phase.kind !== "confirming",
    opening: phase.kind === "opening",
    payLabel:
      phase.kind === "opening"
        ? t("exchangeMoney.opening")
        : amount
          ? t("exchangeMoney.payAmount", { amount })
          : t("exchangeMoney.payDifference"),
    pay: () => void pay(),
  };
}
