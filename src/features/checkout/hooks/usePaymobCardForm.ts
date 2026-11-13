"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { loadPaymobPixel } from "../utils/paymobPixel";
import { finishPaidCheckout } from "../utils/paymobThreeDs";

/** Why a Paymob card payment did not finish (each brand words it). */
export type PaymobPayError = "timeout" | "declined" | "unconfirmed";

/**
 * Paymob Pixel card form: mounts the SDK into `elementId` (styled with the
 * brand's `customStyle`), tracks card validity, pays on `pay()` and polls the
 * platform, which alone decides whether the order is paid. Paid → the order
 * confirmation; otherwise an error code. `needsRetry`: this attempt is spent,
 * a new one starts from `/checkout/payment/cancel`.
 */
export function usePaymobCardForm({
  orderId,
  clientSecret,
  publicKey,
  enabled,
  elementId,
  customStyle,
}: {
  orderId: string | null;
  clientSecret: string | null;
  publicKey: string | null;
  /** false while the page can't take a payment (e.g. the order is already paid) */
  enabled: boolean;
  elementId: string;
  customStyle: Record<string, unknown>;
}) {
  const [sdkFailed, setSdkFailed] = useState(false);
  const [cardValid, setCardValid] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [error, setError] = useState<PaymobPayError | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);
  const mounted = useRef(false);

  // SDK callbacks registered in the effect below read the latest values.
  const currentOrderId = useEffectEvent(() => orderId);
  const currentStyle = useEffectEvent(() => customStyle);

  useEffect(() => {
    if (!clientSecret || !publicKey || !enabled) return;
    let cancelled = false;
    mounted.current = false;
    const pixelScript = loadPaymobPixel();

    pixelScript.promise
      .then(() => {
        if (cancelled || !window.Pixel || mounted.current) return;
        const host = document.getElementById(elementId);
        if (!host) return;
        host.replaceChildren();
        mounted.current = true;
        try {
          new window.Pixel({
            publicKey,
            clientSecret,
            paymentMethods: ["card"],
            elementId,
            disablePay: true,
            showSaveCard: false,
            forceSaveCard: false,
            cardValidationChanged: (isValid) => {
              if (!cancelled) setCardValid(isValid);
            },
            beforePaymentComplete: async () => true,
            afterPaymentComplete: async () => {
              const id = currentOrderId();
              if (!id) return;
              setPhase("polling");
              setError(null);
              const result = await pollUntilPaymentSettles(id);
              if (result.success) {
                finishPaidCheckout(id);
                return;
              }
              setPhase("idle");
              if (result.status === "TIMEOUT") {
                setError("timeout");
                return;
              }
              setNeedsRetry(true);
              setError(result.status === "DECLINED" ? "declined" : "unconfirmed");
            },
            customStyle: currentStyle(),
          });
        } catch {
          if (!cancelled) setSdkFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSdkFailed(true);
      });

    return () => {
      cancelled = true;
      mounted.current = false;
      pixelScript.cancel();
      document.getElementById(elementId)?.replaceChildren();
    };
  }, [enabled, clientSecret, publicKey, elementId]);

  /** Submits the Pixel form (Pixel listens for `payFromOutside`). */
  function pay() {
    setPhase("confirming");
    setError(null);
    window.dispatchEvent(new Event("payFromOutside"));
  }

  return {
    sdkFailed,
    cardValid,
    phase,
    error,
    needsRetry,
    canPay: cardValid && phase === "idle" && !needsRetry && !sdkFailed,
    pay,
  };
}
