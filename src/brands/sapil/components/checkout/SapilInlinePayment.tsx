"use client";

import { useMemo } from "react";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
} from "@stripe/react-stripe-js/checkout";
import { usePaymobThreeDsModal } from "@/features/checkout/components/PaymobThreeDsModal";
import type { PaymentSurface } from "@/features/checkout/components/checkout/InlineMethodPayment";
import { submitCheckoutForm, useInlinePaymobCard } from "@/features/checkout/hooks/useInlinePaymobCard";
import { useStripeCardPayment } from "@/features/checkout/hooks/useStripeCardPayment";
import { useStripeWalletPayment } from "@/features/checkout/hooks/useStripeWalletPayment";
import { useTabbyCheckoutCard } from "@/features/checkout/hooks/useTabbyCheckoutCard";
import type { InlinePaymentSession } from "@/features/checkout/utils/startPayment";
import { stripeCheckoutElementsOptions } from "@/features/checkout/utils/stripeCheckoutAppearance";
import type { TabbyLang, TabbySnippetConfig } from "@/features/checkout/utils/tabby";
import { dir as textDirection } from "@/lib/i18n/locales";
import { getStripe } from "@/lib/stripe/getStripe";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink } from "../commerce/shared";
import { SAPIL_PAYMOB_STYLE, SAPIL_STRIPE_LOOK } from "./paymentLook";
import {
  ErrorNote,
  LockIcon,
  SapilThreeDsModal,
  sapilStripeErrorText,
  sapilThreeDsErrorText,
} from "./paymentParts";

/*
 * The card / wallet forms and the Tabby snippet inside the checkout's payment
 * step (v9 `.pay-panel`), on the same shared hooks as Swiss Arabian's
 * `InlineMethodPayment` / `TabbyCheckoutCard`. The page's own Pay button
 * places the order and pays (`sa-inline-pay`), so the card forms have no
 * button of their own.
 */

const CANCEL_HREF = "/checkout/payment/cancel";
const PAYMOB_INLINE_ID = "paymob-elements-inline";

type Contact = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
};

function SecuredNote({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-[8px] text-[13px] text-sapil-muted">
      <LockIcon />
      <span>{children}</span>
    </p>
  );
}

function Status({ children }: { children: string }) {
  return (
    <p role="status" className="text-[14px] text-sapil-ink-2">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ Stripe */

function SapilStripeInlineCard({ orderId, contact }: { orderId: string; contact: Contact }) {
  const t = useSapilCopy();
  const pay = useStripeCardPayment({ orderId, ...contact, onNeedOrder: submitCheckoutForm });

  if (pay.phase === "polling") {
    return (
      <div className="text-center py-[12px]" aria-live="polite" aria-busy="true">
        <span aria-hidden="true" className="block mx-auto mb-[12px] w-[28px] h-[28px] rounded-full border-[3px] border-sapil-line border-t-sapil-accent motion-safe:animate-spin" />
        <p className="font-[600]">{t("checkout.paymentConfirming")}</p>
        <p className="text-[14px] text-sapil-ink-2">{t("checkout.paymentConfirmingBody")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {pay.sessionError ? (
        <ErrorNote>
          {t("checkout.inlineSessionFailed")}{" "}
          <SapilLink href={CANCEL_HREF} className="underline font-[600]">
            {t("checkout.inlineOtherMethod")}
          </SapilLink>
        </ErrorNote>
      ) : null}
      {!pay.ready && !pay.loadFailed && !pay.sessionError ? <Status>{t("checkout.cardFormLoading")}</Status> : null}
      {pay.loadFailed ? <ErrorNote>{t("checkout.cardFormFailed")}</ErrorNote> : null}
      <div className={pay.ready ? undefined : "min-h-[180px]"}>
        <PaymentElement
          options={{
            layout: { type: "accordion", defaultCollapsed: false, radios: "always", spacedAccordionItems: true },
            paymentMethodOrder: ["card"],
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            fields: { billingDetails: { name: "never", email: "never", phone: "never", address: "never" } },
          }}
          onReady={pay.onReady}
          onLoadError={pay.onLoadError}
        />
      </div>
      {pay.error ? <ErrorNote>{sapilStripeErrorText(t, pay.error, { inline: true })}</ErrorNote> : null}
      {pay.phase === "confirming" ? <Status>{t("checkout.cardProcessing")}</Status> : null}
      <SecuredNote>{t("checkout.inlineSecuredStripe")}</SecuredNote>
    </div>
  );
}

function SapilStripeInlineWallet({
  orderId,
  wallet,
  contact,
}: {
  orderId: string;
  wallet: "apple_pay" | "google_pay";
  contact: Contact;
}) {
  const t = useSapilCopy();
  const { error, pay } = useStripeWalletPayment({ orderId, ...contact, onNeedOrder: submitCheckoutForm });
  const apple = wallet === "apple_pay";
  return (
    <div className="flex flex-col gap-[12px]">
      {error ? <ErrorNote>{sapilStripeErrorText(t, error, { inline: true })}</ErrorNote> : null}
      <ExpressCheckoutElement
        options={{
          buttonHeight: 50,
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
      <p className="text-[13px] text-sapil-ink-2">{t(apple ? "checkout.walletAppleNote" : "checkout.walletGoogleNote")}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Paymob */

function SapilPaymobInline({ session }: { session: InlinePaymentSession }) {
  const t = useSapilCopy();
  const threeDs = usePaymobThreeDsModal(session.orderId, { Modal: SapilThreeDsModal });
  const { failed } = useInlinePaymobCard({
    orderId: session.orderId,
    clientSecret: session.clientSecret,
    publicKey: session.publicKey,
    elementId: PAYMOB_INLINE_ID,
    customStyle: SAPIL_PAYMOB_STYLE,
  });
  return (
    <div className="flex flex-col gap-[14px]">
      {failed ? <ErrorNote>{t("checkout.cardFormFailed")}</ErrorNote> : null}
      {threeDs.challengeErrorCode ? <ErrorNote>{sapilThreeDsErrorText(t, threeDs.challengeErrorCode)}</ErrorNote> : null}
      <div id={PAYMOB_INLINE_ID} className="w-full" />
      <SecuredNote>{t("checkout.inlineSecuredPaymob")}</SecuredNote>
      {threeDs.overlay}
    </div>
  );
}

/** Sapil's `InlineMethodPayment`: the selected card or wallet's form in the payment step. */
export function SapilInlinePayment({
  session,
  surface = "card",
  email,
  name,
  phone,
  country,
}: {
  session: InlinePaymentSession;
  surface?: PaymentSurface;
} & Contact) {
  const t = useSapilCopy();
  const stripeOptions = useMemo(
    () =>
      stripeCheckoutElementsOptions(
        session.clientSecret,
        { email, phoneNumber: phone, customerName: name, billingCountry: country },
        SAPIL_STRIPE_LOOK,
      ),
    [session.clientSecret, email, phone, name, country],
  );
  const contact: Contact = { email, name, phone, country };

  if (session.provider === "stripe" && session.publishableKey) {
    return (
      <CheckoutElementsProvider stripe={getStripe(session.publishableKey)} options={stripeOptions}>
        {surface === "apple_pay" || surface === "google_pay" ? (
          <SapilStripeInlineWallet orderId={session.orderId} wallet={surface} contact={contact} />
        ) : (
          <SapilStripeInlineCard orderId={session.orderId} contact={contact} />
        )}
      </CheckoutElementsProvider>
    );
  }
  if (session.provider === "paymob" && session.publicKey) {
    return <SapilPaymobInline session={session} />;
  }
  return <Status>{t("checkout.cardLoadingPayment")}</Status>;
}

/* ------------------------------------------------------------------- Tabby */

/**
 * Tabby's own snippet under the Tabby option (Tabby's wording and layout, as
 * Tabby requires); when it can't be shown, Tabby's standard sentence in v9 text.
 */
export function SapilTabbyCard({
  config,
  total,
  currency,
  lang,
}: {
  config: TabbySnippetConfig | null;
  total: number;
  currency: string;
  lang: TabbyLang;
}) {
  const { hostRef, fallback } = useTabbyCheckoutCard({ config, total, currency, lang });
  if (fallback != null) {
    return (
      <p className="flex items-center gap-[10px] text-[14px] text-sapil-ink-2" dir={textDirection(lang)}>
        <span aria-hidden="true" className="shrink-0 rounded-[6px] bg-sapil-p-mint px-[8px] py-[2px] text-[13px] font-[700] tracking-[-.02em] text-sapil-ink">
          tabby
        </span>
        <span>{fallback}</span>
      </p>
    );
  }
  // Tabby's snippet needs at least 320px; on narrow phones it may use the panel's padding.
  return <div ref={hostRef} className="min-w-[min(320px,100%)] max-480:-mx-[10px]" dir={textDirection(lang)} />;
}
