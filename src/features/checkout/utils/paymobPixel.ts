/** Paymob Pixel (the card form Paymob draws into an element of ours). */

/** Pinned so a floating @latest release cannot change checkout under us. */
export const PAYMOB_PIXEL_SRC = "https://cdn.jsdelivr.net/npm/paymob-pixel@1.2.10/main.js";

export interface PaymobPixelOptions {
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

/** Adds the Pixel script once and waits (15 s at most) for `window.Pixel`. */
export function loadPaymobPixel(): { promise: Promise<void>; cancel: () => void } {
  if (typeof window === "undefined" || window.Pixel) {
    return { promise: Promise.resolve(), cancel: () => undefined };
  }

  let existing = document.querySelector<HTMLScriptElement>("script[data-paymob-pixel]");
  if (!existing) {
    const script = document.createElement("script");
    script.src = PAYMOB_PIXEL_SRC;
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
    existing?.addEventListener(
      "error",
      () => {
        cancel();
        reject(new Error("Paymob Pixel did not load"));
      },
      { once: true },
    );
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
