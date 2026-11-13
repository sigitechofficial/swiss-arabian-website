"use client";

import { useMemo } from "react";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";
import { checkoutError, checkoutNote } from "@/styles/checkoutChrome";
import type { InlinePaymentSession } from "../../utils/startPayment";
import { stripeCheckoutElementsOptions } from "../../utils/stripeCheckoutAppearance";
import { submitCheckoutForm, useInlinePaymobCard } from "../../hooks/useInlinePaymobCard";
import { StripeCardPaymentForm, StripeWalletPaymentForm } from "../StripeCardPaymentForm";
import { usePaymobThreeDsModal } from "../PaymobThreeDsModal";

/** Swiss Arabian's look for the Paymob Pixel card fields. */
const PAYMOB_INLINE_STYLE = {
  Font_Family: "Arial",
  Font_Size_Label: "16",
  Font_Size_Input_Fields: "16",
  Font_Size_Payment_Button: "16",
  Font_Weight_Label: 500,
  Font_Weight_Input_Fields: 400,
  Font_Weight_Payment_Button: 500,
  Color_Container: "#ffffff",
  Color_Border_Input_Fields: "#e4e0d8",
  Color_Border_Payment_Button: "#8c4435",
  Radius_Border: "8",
  Color_Disabled: "#a3978a",
  Color_Error: "#b4483f",
  Color_Primary: "#8c4435",
  Color_Input_Fields: "#ffffff",
  Text_Color_For_Label: "#241f1b",
  Text_Color_For_Payment_Button: "#ffffff",
  Text_Color_For_Input_Fields: "#241f1b",
  Color_For_Text_Placeholder: "#a3978a",
  Width_of_Container: "100%",
  Vertical_Padding: "48",
  Vertical_Spacing_between_components: "14",
  Container_Padding: "0",
};

export type PaymentSurface = "card" | "apple_pay" | "google_pay";

export function InlineMethodPayment({
  session,
  surface = "card",
  email,
  name,
  phone,
  country,
}: {
  session: InlinePaymentSession;
  surface?: PaymentSurface;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
}) {
  const stripeOptions = useMemo<StripeCheckoutElementsSdkOptions>(
    () =>
      stripeCheckoutElementsOptions(session.clientSecret, {
        email,
        phoneNumber: phone,
        customerName: name,
        billingCountry: country,
      }),
    [session.clientSecret, email, phone, name, country],
  );

  if (session.provider === "stripe" && session.publishableKey) {
    return (
      <CheckoutElementsProvider stripe={getStripe(session.publishableKey)} options={stripeOptions}>
        {surface === "apple_pay" || surface === "google_pay" ? (
          <StripeWalletPaymentForm
            orderId={session.orderId}
            wallet={surface}
            email={email}
            name={name}
            phone={phone}
            country={country}
            onNeedOrder={submitCheckoutForm}
          />
        ) : (
          <StripeCardPaymentForm
            orderId={session.orderId}
            email={email}
            name={name}
            phone={phone}
            country={country}
            onNeedOrder={submitCheckoutForm}
          />
        )}
      </CheckoutElementsProvider>
    );
  }

  if (session.provider === "paymob" && session.publicKey) {
    return <PaymobDrop session={session} />;
  }

  return <p className={checkoutNote}>Loading secure payment…</p>;
}

function PaymobDrop({ session }: { session: InlinePaymentSession }) {
  const threeDs = usePaymobThreeDsModal(session.orderId);
  const hostId = "paymob-elements-inline";
  const { failed } = useInlinePaymobCard({
    orderId: session.orderId,
    clientSecret: session.clientSecret,
    publicKey: session.publicKey,
    elementId: hostId,
    customStyle: PAYMOB_INLINE_STYLE,
  });

  return (
    <div className="flex flex-col gap-3">
      {failed ? <p className={checkoutError}>We couldn’t load the card form. Please refresh and try again.</p> : null}
      {threeDs.challengeError ? <p className={checkoutError}>{threeDs.challengeError}</p> : null}
      <div id={hostId} />
      <CardSecureNote processor="Paymob" />
      {threeDs.overlay}
    </div>
  );
}

function CardSecureNote({ processor }: { processor: "Paymob" | "Stripe" }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-[0.85rem] text-[var(--ink,#241f1b)]">
        <input type="checkbox" className="size-4 accent-copper" />
        Save this card for next time
      </label>
      <p className="m-0 text-[0.75rem] leading-snug text-[var(--ink-2,#5b5148)]">
        Card details go straight to {processor}. We never store your full card number.
      </p>
    </div>
  );
}

export function InlineWalletMarks({ apple, google }: { apple: boolean; google: boolean }) {
  if (!apple && !google) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {apple ? <ApplePayMark /> : null}
      {google ? <GooglePayMark /> : null}
    </div>
  );
}

function ApplePayMark() {
  return (
    <div
      className="flex h-12 w-full cursor-default items-center justify-center gap-1.5 rounded-[8px] bg-black text-white"
      role="img"
      aria-label="Apple Pay, coming soon"
      title="Coming soon"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.2 9.5c0-2.1 1.7-3.1 1.8-3.2-1-.1-1.9.6-2.4.6-.5 0-1.3-.6-2.2-.5-1.1.1-2.1.6-2.7 1.6-1.1 2-.3 4.9.8 6.5.5.8 1.2 1.7 2 1.6.8 0 1.1-.5 2.1-.5s1.3.5 2.2.5c.9 0 1.4-.8 2-1.6.6-.9.9-1.8.9-1.8s-1.7-.7-1.7-2.6zM12.6 5.2c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.5-.4 2-1z"
        />
      </svg>
      <span className="text-[1.05rem] font-medium tracking-[-0.02em]">Pay</span>
    </div>
  );
}

function GooglePayMark() {
  return (
    <div
      className="flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-[8px] border border-[#747775] bg-white"
      role="img"
      aria-label="Google Pay, coming soon"
      title="Coming soon"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
        <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
        <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
      </svg>
      <span className="text-[1.05rem] font-medium tracking-[-0.02em] text-[#3c4043]">Pay</span>
    </div>
  );
}
