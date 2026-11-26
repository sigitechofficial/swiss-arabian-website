"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { MessageKey } from "@/lib/i18n/messages";
import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { LoaderMark } from "@/components/ui/PageLoading";
import { formatMoney } from "@/lib/format/money";
import { useCardPaymentSession } from "../hooks/useCardPaymentSession";
import { usePaymobCardForm, type PaymobPayError } from "../hooks/usePaymobCardForm";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
import { usePaymobThreeDsModal } from "./PaymobThreeDsModal";
import { OrderSummary } from "./StripePaymentFormView";
import { collectionTitle, pageTitle, stateEyebrow } from "@/styles/shopChrome";
import {
  cbox,
  cboxBody,
  cboxHead,
  cboxNum,
  checkoutCta,
  checkoutCtaInline,
  checkoutEmpty,
  checkoutError,
  checkoutForm,
  checkoutHead,
  checkoutLayout,
  checkoutLegal,
  checkoutLink,
  checkoutNote,
  checkoutStepCurrent,
  checkoutSteps,
  stripePayBrands,
  stripePayCta,
  stripePayForm,
  stripePayHead,
  stripePayNum,
  stripePayState,
  stripePayStateTitle,
  stripePayTrust,
} from "@/styles/checkoutChrome";

const ELEMENT_ID = "paymob-elements";

const BRAND = {
  copper: "#8c4435",
  ink: "#241f1b",
  ink2: "#5b5148",
  line: "#d9ccb4",
  danger: "#b4483f",
};

const PIXEL_STYLE = {
  Font_Family: "Arial",
  Font_Size_Label: "16",
  Font_Size_Input_Fields: "16",
  Font_Size_Payment_Button: "16",
  Font_Weight_Label: 500,
  Font_Weight_Input_Fields: 400,
  Font_Weight_Payment_Button: 500,
  Color_Container: "#ffffff",
  Color_Border_Input_Fields: BRAND.line,
  Color_Border_Payment_Button: BRAND.copper,
  Radius_Border: "8",
  Color_Disabled: "#a3978a",
  Color_Error: BRAND.danger,
  Color_Primary: BRAND.copper,
  Color_Input_Fields: "#ffffff",
  Text_Color_For_Label: BRAND.ink,
  Text_Color_For_Payment_Button: "#ffffff",
  Text_Color_For_Input_Fields: BRAND.ink,
  Color_For_Text_Placeholder: "#a3978a",
  Width_of_Container: "100%",
  // Pixel treats this as the input height in pixels. The SDK default is 40.
  Vertical_Padding: "48",
  Vertical_Spacing_between_components: "14",
  Container_Padding: "0",
};

const ERROR_TEXT: Record<PaymobPayError, MessageKey> = {
  timeout: "checkout.paymob.error.timeout",
  declined: "checkout.paymob.error.declined",
  unconfirmed: "checkout.paymob.error.unconfirmed",
};

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function PaymobPaymentFormView() {
  const t = useShopCopy();
  const session = useCardPaymentSession("paymob");
  const { hydrated, orderId, clientSecret, alreadyPaid } = session;
  const publicKey = session.providerKey;
  const threeDs = usePaymobThreeDsModal(orderId);
  const card = usePaymobCardForm({
    orderId,
    clientSecret,
    publicKey,
    enabled: !alreadyPaid,
    elementId: ELEMENT_ID,
    customStyle: PIXEL_STYLE,
  });
  const { sdkFailed, phase, needsRetry } = card;
  const errorMsg = card.error ? t(ERROR_TEXT[card.error]) : null;

  if (!hydrated || alreadyPaid) {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <CheckoutSpinnerState title={t("checkout.pay.loadingSecure")} />
      </CheckoutStateShell>
    );
  }

  if (!clientSecret || !publicKey || !orderId) {
    return (
      <CheckoutStateShell current={t("checkout.state.payment")}>
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>{t("checkout.state.payment")}</p>
          <h1 className={collectionTitle}>{t("checkout.pay.sessionExpired")}</h1>
          <p>{t("checkout.pay.sessionExpiredBody")}</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/checkout/payment/cancel">
            <span>{t("checkout.state.retryPayment")}</span>
            <b aria-hidden="true">↗</b>
          </LocaleLink>
        </section>
      </CheckoutStateShell>
    );
  }

  const total = session.order
    ? formatMoney(Number(session.order.totals.total), session.order.currency)
    : null;

  return (
    <CheckoutStateShell current={t("checkout.state.payment")}>
      <header className={checkoutHead}>
        <h1 className={pageTitle}>{t("checkout.state.payment")}</h1>
        <ol className={checkoutSteps}>
          <li>
            <LocaleLink href="/cart">{t("nav.bag")}</LocaleLink>
          </li>
          <li aria-hidden="true">·</li>
          <li>{t("checkout.pay.detailsStep")}</li>
          <li aria-hidden="true">·</li>
          <li className={checkoutStepCurrent}>{t("checkout.state.payment")}</li>
        </ol>
      </header>

      <div className={checkoutLayout}>
        <div className={`${checkoutForm} ${stripePayForm}`}>
          <section className={cbox} aria-labelledby="card-payment-heading">
            <div className={`${cboxHead} ${stripePayHead}`}>
              <span className={`${cboxNum} ${stripePayNum}`}>
                <LockIcon />
              </span>
              <h2 id="card-payment-heading">{t("checkout.paymob.title")}</h2>
              <span className={stripePayBrands} aria-label={t("checkout.paymob.brands")}>
                Visa · Mastercard
              </span>
            </div>
            <div className={cboxBody}>
              {phase === "polling" ? (
                <div className={stripePayState} aria-live="polite" aria-busy="true">
                  <LoaderMark size={84} />
                  <p className={stripePayStateTitle}>{t("checkout.state.confirmingTitle")}</p>
                  <p className={checkoutNote}>{t("checkout.pay.confirmingBody")}</p>
                </div>
              ) : (
                <>
                  {threeDs.challengeError ? (
                    <p className={checkoutError} role="alert">
                      {threeDs.challengeError}
                    </p>
                  ) : null}
                  {sdkFailed ? (
                    <p className={checkoutError} role="alert">
                      <TextWithLinks
                        text={t("checkout.pay.formFailed", linkSlots(["other"]))}
                        links={{
                          other: (
                            <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
                              {t("checkout.pay.otherWay")}
                            </LocaleLink>
                          ),
                        }}
                      />
                    </p>
                  ) : null}
                  <div id={ELEMENT_ID} className="w-full" />
                  {errorMsg ? (
                    <p className={checkoutError} role="alert">
                      {errorMsg}
                      {needsRetry ? (
                        <>
                          {" "}
                          <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
                            {t("checkout.paymob.newAttempt")}
                          </LocaleLink>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={`${checkoutCta} ${stripePayCta}`}
                    disabled={!card.canPay}
                    onClick={card.pay}
                  >
                    <span>
                      {phase === "confirming"
                        ? t("subs.checkout.processing")
                        : total
                          ? t("checkout.pay.payAmount", { amount: total })
                          : t("checkout.confirmation.payNow")}
                    </span>
                    <b aria-hidden="true">↗</b>
                  </button>
                  <p className={stripePayTrust}>
                    <LockIcon />
                    <span>{t("checkout.paymob.secured")}</span>
                  </p>
                </>
              )}
            </div>
          </section>
          <p className={checkoutLegal}>
            <TextWithLinks
              text={t("checkout.pay.changedMind", linkSlots(["cancel"]))}
              links={{ cancel: <LocaleLink href="/checkout/payment/cancel">{t("checkout.pay.cancelPayment")}</LocaleLink> }}
            />
          </p>
        </div>

        <OrderSummary order={session.order} loading={session.orderLoading} />
      </div>
      {threeDs.overlay}
    </CheckoutStateShell>
  );
}
