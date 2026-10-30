"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderMark } from "@/components/ui/PageLoading";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useHydrated } from "@/hooks/useHydrated";
import { getOrder, pollUntilPaymentSettles } from "../api/orders.service";
import {
  clearPaymentState,
  getStoredOrderId,
  getStoredPaymobClientSecret,
  getStoredPaymobPublicKey,
} from "../utils/checkoutSession";
import { CheckoutSpinnerState, CheckoutStateShell } from "./CheckoutStateShell";
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

/** Pinned so a floating @latest release cannot change checkout under us. */
const PIXEL_SRC = "https://cdn.jsdelivr.net/npm/paymob-pixel@1.2.10/main.js";
const ELEMENT_ID = "paymob-elements";

const BRAND = {
  copper: "#8c4435",
  ink: "#241f1b",
  ink2: "#5b5148",
  line: "#d9ccb4",
  danger: "#b4483f",
};

interface PaymobPixelOptions {
  publicKey: string;
  clientSecret: string;
  paymentMethods: string[];
  elementId: string;
  disablePay?: boolean;
  showSaveCard?: boolean;
  forceSaveCard?: boolean;
  cardValidationChanged?: (isValid: boolean) => void;
  beforePaymentComplete?: () => Promise<boolean>;
  afterPaymentComplete?: (response: unknown) => Promise<void> | void;
  customStyle?: Record<string, unknown>;
}

declare global {
  interface Window {
    Pixel?: new (options: PaymobPixelOptions) => unknown;
  }
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function loadPixelScript(): { promise: Promise<void>; cancel: () => void } {
  if (typeof window === "undefined" || window.Pixel) {
    return { promise: Promise.resolve(), cancel: () => undefined };
  }

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

  let timer = 0;
  const cancel = () => window.clearInterval(timer);
  const promise = new Promise<void>((resolve, reject) => {
    const started = Date.now();
    existing?.addEventListener("error", () => {
      cancel();
      reject(new Error("Paymob Pixel did not load"));
    }, { once: true });
    timer = window.setInterval(() => {
      if (window.Pixel) {
        cancel();
        resolve();
        return;
      }
      if (Date.now() - started > 15_000) {
        cancel();
        reject(new Error("Paymob Pixel did not load"));
      }
    }, 50);
  });
  return { promise, cancel };
}

export function PaymobPaymentFormView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [sdkFailed, setSdkFailed] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);
  const mounted = useRef(false);

  const ctx = useMemo(
    () =>
      hydrated
        ? {
            clientSecret: getStoredPaymobClientSecret(),
            publicKey: getStoredPaymobPublicKey(),
            orderId: getStoredOrderId(),
          }
        : null,
    [hydrated],
  );
  const orderId = ctx?.orderId ?? null;
  const clientSecret = ctx?.clientSecret ?? null;
  const publicKey = ctx?.publicKey ?? null;

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId as string),
    enabled: Boolean(orderId && clientSecret),
    retry: 1,
    staleTime: 60_000,
  });

  const paymentStatus = orderQuery.data?.paymentStatus?.toUpperCase();
  const alreadyPaid = paymentStatus === "PAID" || paymentStatus === "AUTHORIZED";
  useEffect(() => {
    if (!alreadyPaid || !orderId) return;
    clearPaymentState();
    router.replace(`/order-confirmation/${orderId}`);
  }, [alreadyPaid, orderId, router]);

  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!clientSecret || !publicKey || alreadyPaid) return;
    let cancelled = false;
    mounted.current = false;
    const pixelScript = loadPixelScript();

    pixelScript.promise
      .then(() => {
        if (cancelled || !window.Pixel || mounted.current) return;
        const host = document.getElementById(ELEMENT_ID);
        if (!host) return;
        host.replaceChildren();
        mounted.current = true;
        new window.Pixel({
          publicKey,
          clientSecret,
          paymentMethods: ["card"],
          elementId: ELEMENT_ID,
          disablePay: true,
          showSaveCard: false,
          forceSaveCard: false,
          cardValidationChanged: (isValid) => {
            if (!cancelled) setCardValid(isValid);
          },
          beforePaymentComplete: async () => true,
          afterPaymentComplete: async () => {
            const id = orderIdRef.current;
            if (!id) return;
            setPhase("polling");
            setErrorMsg(null);
            const result = await pollUntilPaymentSettles(id);
            if (result.success) {
              clearPaymentState();
              routerRef.current.replace(`/order-confirmation/${id}`);
              return;
            }
            setPhase("idle");
            if (result.status === "TIMEOUT") {
              setErrorMsg(
                "Your payment is taking longer than expected to confirm. Please check your email before trying again.",
              );
              return;
            }
            setNeedsRetry(true);
            setErrorMsg(
              result.status === "DECLINED"
                ? "Your card was declined. Please start a new payment attempt with another card."
                : "We couldn’t confirm your payment. If your card was charged, please contact us before retrying.",
            );
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
          },
        });
      })
      .catch(() => {
        if (!cancelled) setSdkFailed(true);
      });

    return () => {
      cancelled = true;
      mounted.current = false;
      pixelScript.cancel();
      document.getElementById(ELEMENT_ID)?.replaceChildren();
    };
  }, [alreadyPaid, clientSecret, publicKey]);

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

  const total = orderQuery.data
    ? formatMoney(Number(orderQuery.data.totals.total), orderQuery.data.currency)
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
                    disabled={!cardValid || phase !== "idle" || needsRetry || sdkFailed}
                    onClick={() => {
                      setPhase("confirming");
                      setErrorMsg(null);
                      window.dispatchEvent(new Event("payFromOutside"));
                    }}
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

        <OrderSummary order={orderQuery.data} loading={orderQuery.isPending} />
      </div>
    </CheckoutStateShell>
  );
}
