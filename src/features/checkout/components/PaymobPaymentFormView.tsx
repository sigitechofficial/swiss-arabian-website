"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { LoaderMark } from "@/components/ui/PageLoading";
import { formatMoney } from "@/features/home/utils/formatMoney";
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

const ERROR_TEXT: Record<PaymobPayError, string> = {
  timeout: "Your payment is taking longer than expected to confirm. Please check your email before trying again.",
  declined: "Your card was declined. Please start a new payment attempt with another card.",
  unconfirmed: "We couldn’t confirm your payment. If your card was charged, please contact us before retrying.",
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
  const errorMsg = card.error ? ERROR_TEXT[card.error] : null;

  if (!hydrated || alreadyPaid) {
    return (
      <CheckoutStateShell current="Payment">
        <CheckoutSpinnerState title="Loading secure payment…" />
      </CheckoutStateShell>
    );
  }

  if (!clientSecret || !publicKey || !orderId) {
    return (
      <CheckoutStateShell current="Payment">
        <section className={checkoutEmpty}>
          <p className={stateEyebrow}>Payment</p>
          <h1 className={collectionTitle}>This payment session has expired.</h1>
          <p>If you already placed an order, you can finish paying for it from here.</p>
          <LocaleLink className={`${checkoutCta} ${checkoutCtaInline}`} href="/checkout/payment/cancel">
            <span>Retry payment</span>
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
    <CheckoutStateShell current="Payment">
      <header className={checkoutHead}>
        <h1 className={pageTitle}>Payment</h1>
        <ol className={checkoutSteps}>
          <li>
            <LocaleLink href="/cart">Bag</LocaleLink>
          </li>
          <li aria-hidden="true">·</li>
          <li>Details</li>
          <li aria-hidden="true">·</li>
          <li className={checkoutStepCurrent}>Payment</li>
        </ol>
      </header>

      <div className={checkoutLayout}>
        <div className={`${checkoutForm} ${stripePayForm}`}>
          <section className={cbox} aria-labelledby="card-payment-heading">
            <div className={`${cboxHead} ${stripePayHead}`}>
              <span className={`${cboxNum} ${stripePayNum}`}>
                <LockIcon />
              </span>
              <h2 id="card-payment-heading">Card details</h2>
              <span className={stripePayBrands} aria-label="Visa and Mastercard accepted">
                Visa · Mastercard
              </span>
            </div>
            <div className={cboxBody}>
              {phase === "polling" ? (
                <div className={stripePayState} aria-live="polite" aria-busy="true">
                  <LoaderMark size={84} />
                  <p className={stripePayStateTitle}>Confirming your payment…</p>
                  <p className={checkoutNote}>This usually takes a few seconds. Please don’t close this page.</p>
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
                      We couldn’t load the secure card form. Please refresh the page or{" "}
                      <LocaleLink className={checkoutLink} href="/checkout/payment/cancel">
                        choose another way to pay
                      </LocaleLink>
                      .
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
                            Start a new attempt
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
                      {phase === "confirming" ? "Processing…" : total ? `Pay ${total}` : "Pay now"}
                    </span>
                    <b aria-hidden="true">↗</b>
                  </button>
                  <p className={stripePayTrust}>
                    <LockIcon />
                    <span>Secured by Paymob — your card details never touch our servers.</span>
                  </p>
                </>
              )}
            </div>
          </section>
          <p className={checkoutLegal}>
            Changed your mind? <LocaleLink href="/checkout/payment/cancel">Cancel payment</LocaleLink> — your order stays saved.
          </p>
        </div>

        <OrderSummary order={session.order} loading={session.orderLoading} />
      </div>
      {threeDs.overlay}
    </CheckoutStateShell>
  );
}
