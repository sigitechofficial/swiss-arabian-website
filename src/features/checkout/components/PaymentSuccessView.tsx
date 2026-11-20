"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useHydrated } from "@/hooks/useHydrated";
import { storedOrderIdIf, useSettlePayment } from "../hooks/usePaymentReturn";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { EM_SLOT, EmphasisCopy } from "./EmphasisCopy";
import { collectionTitle, doneEm, doneTitle, stateEyebrow, stateIntro } from "@/styles/shopChrome";
import {
  checkoutCta,
  checkoutCtaInline,
  checkoutDone,
  checkoutDoneActions,
  checkoutEmpty,
  checkoutLink,
} from "@/styles/checkoutChrome";

/**
 * Gateway return URL (Paymob, and Stripe after a 3DS redirect). The redirect
 * itself proves nothing — the provider webhook decides — so poll the backend.
 */
export function PaymentSuccessView() {
  const t = useShopCopy();
  const hydrated = useHydrated();
  const orderId = storedOrderIdIf(hydrated);
  const outcome = useSettlePayment(orderId);

  if (!hydrated || (orderId && (!outcome || outcome.kind === "paid"))) {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState
          eyebrow={t("checkout.state.payment")}
          title={t("checkout.state.confirmingTitle")}
          body={t("checkout.state.confirmingBody")}
        />
      </CheckoutStateShell>
    );
  }

  if (!orderId) {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>{t("checkout.state.payment")}</p>
          <h1 className={collectionTitle}>{t("checkout.state.orderNotFound")}</h1>
          <p>{t("checkout.state.noOrderBody")}</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/">
            <span>{t("checkout.state.returnHome")}</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  if (outcome?.kind === "timeout") {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutDone}>
          <p className={stateEyebrow}>{t("checkout.state.stillProcessing")}</p>
          <h1 className={doneTitle}>
            <EmphasisCopy text={t("checkout.state.slowTitle", EM_SLOT)} em={t("checkout.state.slowEm")} className={doneEm} />
          </h1>
          <p className={stateIntro}>
            {t("checkout.state.slowBody")}
          </p>
          <div className={checkoutDoneActions}>
            <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href={`/order-confirmation/${orderId}?verify=1`}>
              <span>{t("checkout.state.orderStatus")}</span>
              <b aria-hidden="true">↗</b>
            </LocaleLink>
            <LocaleLink className={checkoutLink} href="/">
              {t("checkout.state.returnHome")}
            </LocaleLink>
          </div>
        </section>
      </CheckoutStateShell>
    );
  }

  const declined = outcome?.kind === "failed" && outcome.status === "DECLINED";
  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <section className={checkoutDone}>
        <p className={stateEyebrow}>{t("checkout.state.unsuccessful")}</p>
        <h1 className={doneTitle}>
          <EmphasisCopy text={t("checkout.state.failedTitle", EM_SLOT)} em={t("checkout.state.failedEm")} className={doneEm} />
        </h1>
        <p className={stateIntro}>
          {declined
            ? t("checkout.state.cardDeclinedBody")
            : t("checkout.state.processFailedBody")}
        </p>
        <div className={checkoutDoneActions}>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/checkout/payment/cancel">
            <span>{t("tryAgain")}</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
          <LocaleLink className={checkoutLink} href="/">
            {t("checkout.state.returnHome")}
          </LocaleLink>
        </div>
      </section>
    </CheckoutStateShell>
  );
}
