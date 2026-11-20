"use client";
import { providerTextIn } from "../utils/providerText";

import { isRtl } from "@/lib/i18n/locales";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
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
  type TamaraLang,
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

const COPY: Record<
  TamaraLang,
  {
    confirmingEyebrow: string;
    confirming: string;
    dontClose: string;
    checking: string;
    paidTitle: string;
    paidBody: string;
    cancelEyebrow: string;
    failureEyebrow: string;
    pendingEyebrow: string;
    pendingTitle: string;
    pendingBody: string;
    retry: string;
    backToCheckout: string;
    returning: string;
    keptError: string;
    orderStatus: string;
    home: string;
    noOrderTitle: string;
    noOrderBody: string;
  }
> = {
  en: {
    confirmingEyebrow: "Verification pending",
    confirming: "We’re confirming your payment with Tamara.",
    dontClose: "Don’t close this page.",
    checking: "Checking payment status…",
    paidTitle: "Payment confirmed…",
    paidBody: "Taking you to your order.",
    cancelEyebrow: "Payment cancelled",
    failureEyebrow: "Payment not approved",
    pendingEyebrow: "Confirming payment",
    pendingTitle: "We’re confirming your payment",
    pendingBody: "You’ll get an email shortly. There’s no need to pay again.",
    retry: "Choose another payment method",
    backToCheckout: "Back to checkout",
    returning: "Opening checkout…",
    keptError:
      "We couldn’t reopen your bag because a payment for this order is still being processed. Please check your order status in a few minutes.",
    orderStatus: "Check order status",
    home: "Return home",
    noOrderTitle: "We couldn’t match this return to an order.",
    noOrderBody: "If you completed a payment, your confirmation email has the details.",
  },
  ar: {
    confirmingEyebrow: "جارٍ التحقق",
    confirming: "نقوم بتأكيد دفعتك مع تمارا.",
    dontClose: "لا تغلق هذه الصفحة.",
    checking: "جارٍ التحقق من حالة الدفع…",
    paidTitle: "تم تأكيد الدفع…",
    paidBody: "جارٍ تحويلك إلى طلبك.",
    cancelEyebrow: "تم إلغاء الدفع",
    failureEyebrow: "لم تتم الموافقة على الدفع",
    pendingEyebrow: "جارٍ تأكيد الدفع",
    pendingTitle: "نقوم بتأكيد دفعتك",
    pendingBody: "ستصلك رسالة بريد إلكتروني قريبًا. لا حاجة للدفع مرة أخرى.",
    retry: "اختر طريقة دفع أخرى",
    backToCheckout: "العودة إلى صفحة الدفع",
    returning: "جارٍ فتح صفحة الدفع…",
    keptError:
      "تعذّر إعادة فتح سلة التسوق لأن دفعة لهذا الطلب ما زالت قيد المعالجة. يرجى التحقق من حالة الطلب بعد بضع دقائق.",
    orderStatus: "تحقق من حالة الطلب",
    home: "العودة إلى الرئيسية",
    noOrderTitle: "تعذّر ربط هذه العودة بطلب.",
    noOrderBody: "إذا أتممت الدفع، ستجد التفاصيل في رسالة التأكيد.",
  },
};

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
  const copy = COPY[lang];

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
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState
          eyebrow={copy.confirmingEyebrow}
          title={hint === "cancel" || hint === "failure" ? copy.checking : copy.confirming}
          body={copy.dontClose}
        />
      </CheckoutStateShell>
    );
  }

  if (outcome.kind === "paid") {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState eyebrow="Tamara" title={copy.paidTitle} body={copy.paidBody} />
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
      <CheckoutStateShell current="Payment">
        <section className={checkoutDone} dir={isRtl(lang) ? "rtl" : undefined}>
          <p className={stateEyebrow}>{cancelled ? copy.cancelEyebrow : copy.failureEyebrow}</p>
          <h1 className={doneTitle} role="alert">
            {message}
          </h1>
          {back.failed ? (
            <p className={checkoutError} role="alert">
              {copy.keptError}
            </p>
          ) : null}
          <div className={checkoutDoneActions}>
            <button
              type="button"
              className={`${checkoutCta} ${checkoutCtaInline}`}
              onClick={() => void back.go(!cancelled)}
              disabled={back.returning}
            >
              <span>{back.returning ? copy.returning : cancelled ? copy.backToCheckout : copy.retry}</span>
              <b aria-hidden="true">↗</b>
            </button>
            <LocaleLink className={checkoutLink} href="/">
              {copy.home}
            </LocaleLink>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  // Still pending after polling (the backend keeps confirming in the background),
  // or a success link we can't match to an order in this browser.
  return (
    <CheckoutStateShell current="Payment">
      <section className={checkoutDone} dir={isRtl(lang) ? "rtl" : undefined}>
        <p className={stateEyebrow}>{copy.pendingEyebrow}</p>
        <h1 className={doneTitle}>
          {outcome.kind === "no-order" ? (
            copy.noOrderTitle
          ) : (
            <>
              {copy.pendingTitle}
              <em className={doneEm}>…</em>
            </>
          )}
        </h1>
        <p className={stateIntro}>
          {outcome.kind === "no-order" ? copy.noOrderBody : copy.pendingBody}
        </p>
        <div className={checkoutDoneActions}>
          {orderId ? (
            <LocaleLink
              className={`${checkoutCta} ${checkoutCtaInline}`}
              href={`/order-confirmation/${orderId}?verify=1`}
            >
              <span>{copy.orderStatus}</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          ) : (
            <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
              <span>{copy.home}</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
          )}
          {orderId ? (
            <LocaleLink className={checkoutLink} href="/">
              {copy.home}
            </LocaleLink>
          ) : null}
        </div>
      </section>
    </CheckoutStateShell>
  );
}
