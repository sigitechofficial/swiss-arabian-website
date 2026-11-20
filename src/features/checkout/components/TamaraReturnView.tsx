"use client";
import { providerTextIn } from "../utils/providerText";

import { isRtl } from "@/lib/i18n/locales";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { useSettlePayment } from "../hooks/usePaymentReturn";
import { getStoredOrderId } from "../utils/checkoutSession";
import { useReturnToCheckout } from "../hooks/useReturnToCheckout";
import { useTamaraLang } from "../hooks/useTamaraLang";
import {
  TAMARA_CANCELLED_MESSAGE,
  TAMARA_REJECTED_MESSAGE,
} from "../utils/tamara";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { doneEm, doneTitle, stateEyebrow, stateIntro } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
  checkoutDoneActions,
  checkoutError,
  checkoutLink,
} from "@/styles/checkoutChrome";

export type TamaraResultHint = "success" | "cancel" | "failure" | "unknown";

type SettleOutcome =
  | { kind: "paid" }
  | { kind: "failed" }
  | { kind: "timeout" }
  | { kind: "no-order" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tamara appends its own `orderId` (Tamara's order id) to the merchant URL, so
 * the query can carry two. Ours comes first; a value matching the order stored
 * in this browser wins, then the first UUID, then the stored order.
 */
export function pickOrderId(values: readonly string[], stored: string | null): string | null {
  const ids = values.map((value) => value.trim()).filter((value) => UUID.test(value));
  if (stored && ids.includes(stored)) return stored;
  return ids[0] ?? stored;
}

export function parseResultHint(raw: string | null): TamaraResultHint {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "success") return "success";
  if (value === "cancel" || value === "cancelled" || value === "canceled") return "cancel";
  if (value === "failure" || value === "failed") return "failure";
  return "unknown";
}

/**
 * Tamara hosted-page return — BE contract `/payments/tamara/return`.
 * Query: `orderId`, `paymentTransactionId`, `paymentAttemptId`, `provider`,
 * `zone`, `result=success|cancel|failure` (ours); Tamara appends its own
 * `orderId` and `paymentStatus`, which are never trusted (see `pickOrderId`).
 *
 * `result` is a hint only. The page never shows a paid order from the query
 * string: it polls `storefront/orders/:id/payment-status`, and the platform
 * confirms the payment with Tamara (authorise + capture) before it reads paid.
 */
export function TamaraReturnView() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const lang = useTamaraLang();
  const t = useShopCopy();

  const hint = useMemo(() => parseResultHint(searchParams.get("result")), [searchParams]);
  // The link names the order this payment was for (the backend adds it); the
  // order last placed in this browser is only a fallback. They differ when the
  // payment was for another order, such as an exchange replacement.
  const orderId = hydrated ? pickOrderId(searchParams.getAll("orderId"), getStoredOrderId()) : null;

  const settlement = useSettlePayment(orderId);
  const outcome: SettleOutcome | null =
    hydrated && !orderId ? { kind: "no-order" } : settlement ? { kind: settlement.kind } : null;

  // As for Tabby: cancelled → checkout with the bag; declined → the bag, without Tamara.
  const back = useReturnToCheckout(orderId, "tamara");

  if (!hydrated || !outcome) {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState
          eyebrow={t("checkout.state.verificationPending")}
          title={hint === "cancel" || hint === "failure" ? t("checkout.state.checking") : t("checkout.tamara.confirming")}
          body={t("checkout.state.dontClose")}
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "paid") {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState eyebrow="Tamara" title={t("checkout.state.paidTitle")} body={t("checkout.state.paidBody")} />
      </CheckoutStateShell>
    );
  }

  // Not paid, and either the platform says so or Tamara sent the shopper back
  // through its cancel / failure link: show Tamara's wording and keep the order.
  const cancelled = hint === "cancel";
  const notPaid =
    outcome.kind === "failed" ||
    ((outcome.kind === "timeout" || outcome.kind === "no-order") &&
      (hint === "cancel" || hint === "failure"));

  if (notPaid) {
    const message = providerTextIn(cancelled ? TAMARA_CANCELLED_MESSAGE : TAMARA_REJECTED_MESSAGE, lang);
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutDone}>
          <p className={stateEyebrow}>{cancelled ? t("checkout.state.cancelled") : t("checkout.state.notApproved")}</p>
          <h1 className={doneTitle} role="alert" dir={isRtl(lang) ? "rtl" : undefined}>
            {message}
          </h1>
          {back.failed ? (
            <p className={checkoutError} role="alert">
              {t("checkout.state.keptError")}
            </p>
          ) : null}
          <div className={checkoutDoneActions}>
            <button
              type="button"
              className={`${checkoutCta} ${checkoutCtaInline}`}
              onClick={() => void back.go(!cancelled)}
              disabled={back.returning}
            >
              <span>{back.returning ? t("checkout.state.opening") : cancelled ? t("checkout.state.backToCheckout") : t("checkout.state.chooseAnother")}</span>
              <b aria-hidden="true">↗</b>
            </button>
            <LocaleLink className={checkoutLink} href="/">
              {t("checkout.state.returnHome")}
            </LocaleLink>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  // Still pending after polling (the backend keeps confirming in the background),
  // or a success link we can't match to an order in this browser.
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <section className={checkoutDone}>
        <p className={stateEyebrow}>{t("checkout.state.confirmingEyebrow")}</p>
        <h1 className={doneTitle}>
          {outcome.kind === "no-order" ? (
            t("checkout.state.noOrderTitle")
          ) : (
            <>
              {t("checkout.state.pendingTitle")}
              <em className={doneEm}>…</em>
            </>
          )}
        </h1>
        <p className={stateIntro}>
          {outcome.kind === "no-order" ? t("checkout.state.noOrderBody") : t("checkout.state.pendingBody")}
        </p>
        <div className={checkoutDoneActions}>
          {orderId ? (
            <LocaleLink
              className={`${checkoutCta} ${checkoutCtaInline}`}
              href={`/order-confirmation/${orderId}?verify=1`}
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
