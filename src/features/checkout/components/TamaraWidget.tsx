"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { tamaraCountry, type TamaraLang } from "../utils/tamara";

/** Tamara's official widget v2. Configured once per page through `window.tamaraWidgetConfig`. */
export const TAMARA_WIDGET_SRC = "https://cdn.tamara.co/widget-v2/tamara-widget.js";

export type TamaraWidgetConfig = {
  lang: TamaraLang;
  country: "AE" | "SA";
  publicKey: string;
};

declare global {
  interface Window {
    tamaraWidgetConfig?: TamaraWidgetConfig;
    TamaraWidgetV2?: { refresh?: () => void };
  }
}

const LOAD_TIMEOUT_MS = 8000;

/**
 * Sets the page-wide config and loads the widget script once. Resolves when the
 * `<tamara-widget>` element is defined.
 */
export function loadTamaraWidget(config: TamaraWidgetConfig): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  window.tamaraWidgetConfig = { ...config };

  let script = document.querySelector<HTMLScriptElement>("script[data-tamara-widget]");
  if (!script) {
    script = document.createElement("script");
    script.src = TAMARA_WIDGET_SRC;
    script.defer = true;
    script.dataset.tamaraWidget = "v2";
    document.head.appendChild(script);
  }
  const element = script;
  if (typeof customElements === "undefined") return Promise.reject(new Error("no custom elements"));
  if (customElements.get("tamara-widget")) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Tamara widget did not load")), LOAD_TIMEOUT_MS);
    void customElements.whenDefined("tamara-widget").then(() => {
      window.clearTimeout(timer);
      resolve();
    });
    element.addEventListener(
      "error",
      () => {
        window.clearTimeout(timer);
        reject(new Error("Tamara widget did not load"));
      },
      { once: true },
    );
  });
}

/**
 * Tamara's widget for an amount (product page, cart or checkout). Rebuilt when
 * the amount, currency, language or key changes; `fallback` is shown when
 * Tamara doesn't cover the currency, no public key is set, or the script fails.
 */
export function TamaraWidget({
  amount,
  currency,
  lang,
  publicKey,
  inlineType = 2,
  fallback = null,
  className,
}: {
  amount: number;
  currency: string;
  lang: TamaraLang;
  publicKey: string;
  /** Tamara's layout variant (2 = product / summary box). */
  inlineType?: number;
  fallback?: ReactNode;
  className?: string;
}) {
  const country = tamaraCountry(currency);
  const key =
    country && publicKey && amount > 0
      ? `${country}|${publicKey}|${lang}|${amount.toFixed(2)}|${inlineType}`
      : null;
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!key || !country) return;
    let cancelled = false;
    void loadTamaraWidget({ lang, country, publicKey })
      .then(() => {
        const host = hostRef.current;
        if (cancelled || !host) return;
        // The widget owns its element; React only owns the host around it.
        const widget = document.createElement("tamara-widget");
        widget.setAttribute("type", "tamara-summary");
        widget.setAttribute("amount", amount.toFixed(2));
        widget.setAttribute("inline-type", String(inlineType));
        host.replaceChildren(widget);
        window.TamaraWidgetV2?.refresh?.();
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, country, lang, publicKey, amount, inlineType]);

  if (!key || failedKey === key) return <>{fallback}</>;
  return <div ref={hostRef} className={className} dir={lang === "ar" ? "rtl" : "ltr"} data-tamara-host="" />;
}
