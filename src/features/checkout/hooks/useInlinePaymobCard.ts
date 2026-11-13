"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { loadPaymobPixel } from "../utils/paymobPixel";
import { finishPaidCheckout } from "../utils/paymobThreeDs";

/**
 * Paymob Pixel card form inside the checkout's payment step. Mounts the SDK
 * into `elementId` with the brand's `customStyle` (no pay button of its own:
 * the checkout's submit places the order, then fires `sa-inline-pay`, which
 * this hook turns into Pixel's `payFromOutside`). When Pixel reports the
 * payment complete, the platform is polled and a paid order opens the
 * confirmation. `failed`: the SDK could not load or start.
 */
export function useInlinePaymobCard({
  orderId,
  clientSecret,
  publicKey,
  elementId,
  customStyle,
}: {
  orderId: string | null;
  clientSecret: string;
  publicKey: string | null | undefined;
  elementId: string;
  customStyle: Record<string, unknown>;
}) {
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);
  // SDK callbacks registered in the effect below read the latest values.
  const currentOrderId = useEffectEvent(() => orderId);
  const currentStyle = useEffectEvent(() => customStyle);

  useEffect(() => {
    if (!publicKey) return;
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
            beforePaymentComplete: async () => true,
            afterPaymentComplete: async () => {
              const id = currentOrderId();
              if (!id) return;
              const result = await pollUntilPaymentSettles(id);
              if (result.success) finishPaidCheckout(id);
            },
            customStyle: currentStyle(),
          });
        } catch {
          if (!cancelled) setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      pixelScript.cancel();
      document.getElementById(elementId)?.replaceChildren();
    };
  }, [clientSecret, publicKey, elementId]);

  useEffect(() => {
    function pay(event: Event) {
      const id = (event as CustomEvent<{ orderId?: string }>).detail?.orderId || orderId;
      if (!id) return;
      window.dispatchEvent(new Event("payFromOutside"));
    }
    window.addEventListener("sa-inline-pay", pay);
    return () => window.removeEventListener("sa-inline-pay", pay);
  }, [orderId]);

  return { failed };
}

/** Places the order from inside a payment form (the checkout page's form). */
export function submitCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (form instanceof HTMLFormElement) form.requestSubmit();
}
