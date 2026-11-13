"use client";

import { ExpressCheckoutElement, PaymentElement } from "@stripe/react-stripe-js/checkout";
import { LoaderMark } from "@/components/ui/PageLoading";
import {
  checkoutCta,
  checkoutError,
  checkoutLink,
  checkoutNote,
  stripePayCta,
  stripePayElementLoading,
  stripePayState,
  stripePayStateTitle,
  stripePayTrust,
} from "@/styles/checkoutChrome";
import { usePathname } from "next/navigation";
import { localizeHref } from "@/lib/i18n/localePath";
import { stripePayErrorText, useStripeCardPayment } from "../hooks/useStripeCardPayment";
import { useStripeWalletPayment } from "../hooks/useStripeWalletPayment";

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Same Stripe Payment Element as `/checkout/payment/stripe`:
 * accordion, wallets, Pay now, then confirmation.
 */
export function StripeCardPaymentForm({
  orderId,
  email,
  name,
  phone,
  country,
  onNeedOrder,
  cancelHref = "/checkout/payment/cancel",
}: {
  orderId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
  onNeedOrder?: () => void;
  cancelHref?: string;
}) {
  const pay = useStripeCardPayment({ orderId, email, name, phone, country, onNeedOrder });
  const { checkoutState, ready, loadFailed, phase } = pay;
  const errorMsg = pay.error ? stripePayErrorText(pay.error) : null;
  const cancelLink = localizeHref(cancelHref, usePathname() || "/");

  return (
    <div className="flex flex-col gap-3">
      {checkoutState.type === "error" ? (
        <p className={checkoutError} role="alert">
          {pay.sessionError ? stripePayErrorText(pay.sessionError) : null}{" "}
          <a className={checkoutLink} href={cancelLink}>
            choose another way to pay
          </a>
        </p>
      ) : null}

      {phase === "polling" ? (
        <div className={stripePayState} aria-live="polite" aria-busy="true">
          <LoaderMark size={84} />
          <p className={stripePayStateTitle}>Confirming your payment…</p>
          <p className={checkoutNote}>This usually takes a few seconds. Please don’t close this page.</p>
        </div>
      ) : (
        <>
          {!ready && !loadFailed && checkoutState.type !== "error" ? (
            <div className={stripePayState} role="status" aria-live="polite">
              <LoaderMark size={72} />
              <p className={checkoutNote}>Loading secure card form…</p>
            </div>
          ) : null}

          {loadFailed ? (
            <p className={checkoutError} role="alert">
              We couldn’t load the secure card form. Please refresh the page or{" "}
              <a className={checkoutLink} href={cancelLink}>
                choose another way to pay
              </a>
              .
            </p>
          ) : null}

          <div className={ready ? undefined : stripePayElementLoading}>
            <PaymentElement
              options={{
                layout: {
                  type: "accordion",
                  defaultCollapsed: false,
                  radios: "always",
                  spacedAccordionItems: true,
                },
                paymentMethodOrder: ["card"],
                wallets: { applePay: "never", googlePay: "never", link: "never" },
                fields: {
                  billingDetails: {
                    name: "never",
                    email: "never",
                    phone: "never",
                    address: "never",
                  },
                },
              }}
              onReady={pay.onReady}
              onLoadError={pay.onLoadError}
            />
          </div>

          {errorMsg ? (
            <p className={checkoutError} role="alert">
              {errorMsg}
            </p>
          ) : null}
          <button
            type="button"
            className={`${checkoutCta} ${stripePayCta}`}
            disabled={!pay.canPay}
            onClick={() => void pay.confirm(orderId)}
          >
            <span>{phase === "confirming" ? "Processing…" : "Pay now"}</span>
            <b aria-hidden="true">↗</b>
          </button>
        </>
      )}
      <p className={stripePayTrust}>
        <LockIcon />
        <span>Secured by Stripe — your card details never touch our servers.</span>
      </p>
    </div>
  );
}

export function StripeWalletPaymentForm({
  orderId,
  wallet,
  email,
  name,
  phone,
  country,
  onNeedOrder,
}: {
  orderId: string;
  wallet: "apple_pay" | "google_pay";
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
  onNeedOrder?: () => void;
}) {
  const { error, pay } = useStripeWalletPayment({ orderId, email, name, phone, country, onNeedOrder });
  const errorMsg = error ? stripePayErrorText(error) : null;
  const apple = wallet === "apple_pay";

  return (
    <div className="flex flex-col gap-3">
      {errorMsg ? (
        <p className={checkoutError} role="alert">
          {errorMsg}
        </p>
      ) : null}
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          buttonType: { applePay: "plain", googlePay: "plain" },
          buttonTheme: { applePay: "black", googlePay: "white" },
          layout: { maxColumns: 1, maxRows: 1, overflow: "never" },
          paymentMethodOrder: apple ? ["apple_pay"] : ["google_pay"],
          paymentMethods: {
            applePay: apple ? "always" : "never",
            googlePay: apple ? "never" : "always",
            link: "never",
            paypal: "never",
            amazonPay: "never",
          },
        }}
        onConfirm={(event) => {
          void pay(event);
        }}
      />
      <p className="m-0 text-[0.82rem] leading-snug text-[var(--ink-2,#5b5148)]">
        {apple
          ? "You’ll confirm the payment with Face ID, Touch ID, or your device passcode."
          : "You’ll pick one of the cards saved in your Google account."}
      </p>
    </div>
  );
}

export function StripePayLockIcon() {
  return <LockIcon />;
}
