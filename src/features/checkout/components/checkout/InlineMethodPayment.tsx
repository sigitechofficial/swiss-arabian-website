"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutElementsSdkOptions, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";
import { checkoutError, checkoutNote } from "@/styles/checkoutChrome";
import { clearPaymentState } from "../../utils/checkoutSession";
import { pollUntilPaymentSettles } from "../../api/orders.service";
import type { InlinePaymentSession } from "../../utils/startPayment";
const PIXEL_SRC = "https://cdn.jsdelivr.net/npm/paymob-pixel@1.2.10/main.js";

function loadPixelScript(): Promise<void> {
  if (typeof window === "undefined" || window.Pixel) return Promise.resolve();
  let existing = document.querySelector<HTMLScriptElement>("script[data-paymob-pixel]");
  if (!existing) {
    const script = document.createElement("script");
    script.src = PIXEL_SRC;
    script.type = "module";
    script.async = true;
    script.dataset.paymobPixel = "true";
    document.head.appendChild(script);
    existing = script;
  }
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Pixel) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 15_000) {
        window.clearInterval(timer);
        reject(new Error("Paymob Pixel did not load"));
      }
    }, 50);
  });
}

function StripeDropForm({ orderId, surface }: { orderId: string; surface: PaymentSurface }) {
  const checkoutState = useCheckoutElements();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  async function pay(explicitOrderId?: string, expressEvent?: StripeExpressCheckoutElementConfirmEvent) {
    const payingOrderId = explicitOrderId || orderIdRef.current;
    if (checkoutState.type !== "success" || busy || !payingOrderId) {
      if (expressEvent && !payingOrderId) {
        setErrorMsg("Fill in your details, then use the Pay button below. The wallet charge starts after the order is placed.");
      }
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    const result = await checkoutState.checkout.confirm({
      redirect: "if_required",
      ...(expressEvent ? { expressCheckoutConfirmEvent: expressEvent } : {}),
    });
    if (result.type === "error") {
      setErrorMsg(result.error.message || "Payment failed. Please try another method.");
      setBusy(false);
      return;
    }
    const settled = await pollUntilPaymentSettles(payingOrderId);
    if (settled.success) {
      clearPaymentState();
      router.replace(`/order-confirmation/${payingOrderId}`);
      return;
    }
    setBusy(false);
    setErrorMsg("We couldn’t confirm your payment yet. If you were charged, contact us before trying again.");
  }

  useEffect(() => {
    function onPay(event: Event) {
      const id = (event as CustomEvent<{ orderId?: string }>).detail?.orderId;
      if (surface === "apple_pay" || surface === "google_pay") {
        if (id) orderIdRef.current = id;
        return;
      }
      void pay(id);
    }
    window.addEventListener("sa-inline-pay", onPay);
    return () => window.removeEventListener("sa-inline-pay", onPay);
  });

  if (checkoutState.type === "error") {
    return <p className={checkoutError}>{checkoutState.error.message}</p>;
  }

  if (surface === "apple_pay" || surface === "google_pay") {
    const apple = surface === "apple_pay";
    return (
      <div className="flex flex-col gap-3">
        {errorMsg ? <p className={checkoutError}>{errorMsg}</p> : null}
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            buttonType: { applePay: "plain", googlePay: "plain" },
            buttonTheme: { applePay: "black", googlePay: "white" },
            layout: { maxColumns: 1, maxRows: 1, overflow: "never" },
            paymentMethodOrder: [apple ? "apple_pay" : "google_pay"],
            paymentMethods: {
              applePay: apple ? "always" : "never",
              googlePay: apple ? "never" : "always",
              link: "never",
              paypal: "never",
              amazonPay: "never",
            },
          }}
          onConfirm={(event) => {
            void pay(orderIdRef.current, event);
          }}
        />
        <p className="m-0 text-[0.82rem] leading-snug text-[var(--ink-2,#5b5148)]">
          {apple
            ? "You’ll confirm the payment with Face ID or Touch ID."
            : "You’ll pick one of the cards saved in your Google account."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMsg ? <p className={checkoutError}>{errorMsg}</p> : null}
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
          paymentMethodOrder: ["card"],
          wallets: { applePay: "never", googlePay: "never", link: "never" },
          fields: {
            billingDetails: {
              name: "always",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        }}
      />
      <CardSecureNote processor="Stripe" />
    </div>
  );
}

export type PaymentSurface = "card" | "apple_pay" | "google_pay";

export function InlineMethodPayment({
  session,
  surface = "card",
}: {
  session: InlinePaymentSession;
  surface?: PaymentSurface;
}) {
  const stripeOptions = useMemo<StripeCheckoutElementsSdkOptions>(
    () => ({ clientSecret: session.clientSecret }),
    [session.clientSecret],
  );

  if (session.provider === "stripe" && session.publishableKey) {
    return (
      <CheckoutElementsProvider stripe={getStripe(session.publishableKey)} options={stripeOptions}>
        <StripeDropForm orderId={session.orderId} surface={surface} />
      </CheckoutElementsProvider>
    );
  }

  if (session.provider === "paymob" && session.publicKey) {
    return <PaymobDrop session={session} />;
  }

  return <p className={checkoutNote}>Loading secure payment…</p>;
}

function PaymobDrop({ session }: { session: InlinePaymentSession }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const hostId = "paymob-elements-inline";
  const mounted = useRef(false);
  const orderIdRef = useRef(session.orderId);
  orderIdRef.current = session.orderId;

  useEffect(() => {
    if (!session.publicKey) return;
    let cancelled = false;
    mounted.current = false;
    loadPixelScript()
      .then(() => {
        if (cancelled || !window.Pixel || mounted.current) return;
        const host = document.getElementById(hostId);
        if (!host) return;
        host.replaceChildren();
        mounted.current = true;
        new window.Pixel({
          publicKey: session.publicKey!,
          clientSecret: session.clientSecret,
          paymentMethods: ["card"],
          elementId: hostId,
          disablePay: true,
          showSaveCard: false,
          forceSaveCard: false,
          beforePaymentComplete: async () => true,
          afterPaymentComplete: async () => {
            const orderId = orderIdRef.current;
            if (!orderId) return;
            const settled = await pollUntilPaymentSettles(orderId);
            if (settled.success) {
              clearPaymentState();
              router.replace(`/order-confirmation/${orderId}`);
            }
          },
          customStyle: {
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
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      document.getElementById(hostId)?.replaceChildren();
    };
  }, [router, session.clientSecret, session.publicKey]);

  useEffect(() => {
    function pay(event: Event) {
      const orderId = (event as CustomEvent<{ orderId?: string }>).detail?.orderId || session.orderId;
      if (!orderId) return;
      window.dispatchEvent(new Event("payFromOutside"));
    }
    window.addEventListener("sa-inline-pay", pay);
    return () => window.removeEventListener("sa-inline-pay", pay);
  }, [session.orderId]);

  return (
    <div className="flex flex-col gap-3">
      {failed ? <p className={checkoutError}>We couldn’t load the card form. Please refresh and try again.</p> : null}
      <div id={hostId} />
      <CardSecureNote processor="Paymob" />
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
