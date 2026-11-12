"use client";

import { dir as textDirection } from "@/lib/i18n/locales";
import { useEffect, useId, useRef, useState } from "react";
import { payOptNote } from "@/styles/checkoutChrome";
import {
  tabbyFallbackText,
  tabbyPrice,
  type TabbyLang,
  type TabbySnippetConfig,
} from "../../utils/tabby";

type TabbyCardOptions = {
  selector: string;
  currency: string;
  price: string;
  lang: TabbyLang;
  shouldInheritBg: boolean;
  publicKey: string;
  merchantCode: string;
};

declare global {
  interface Window {
    TabbyCard?: new (options: TabbyCardOptions) => unknown;
  }
}

const LOAD_TIMEOUT_MS = 8000;

/** Loads Tabby's `tabby-card.js` once per script host; resolves when `TabbyCard` exists. */
function loadTabbyCard(scriptBase: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.TabbyCard) return Promise.resolve();

  const src = `${scriptBase}/tabby-card.js`;
  let script = document.querySelector<HTMLScriptElement>(`script[data-tabby-card="${src}"]`);
  if (!script) {
    script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.tabbyCard = src;
    document.head.appendChild(script);
  }
  const element = script;

  return new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.TabbyCard) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - started > LOAD_TIMEOUT_MS) {
        window.clearInterval(timer);
        reject(new Error("Tabby card did not load"));
      }
    }, 100);
    element.addEventListener(
      "error",
      () => {
        window.clearInterval(timer);
        reject(new Error("Tabby card did not load"));
      },
      { once: true },
    );
  });
}

/**
 * Tabby's own checkout snippet, shown under the Tabby option while it is
 * selected. It is rebuilt whenever the total, currency or language changes.
 * If the script can't load, Tabby's standard wording is shown instead.
 */
export function TabbyCheckoutCard({
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
  // Tabby: the container id must not be "TabbyCard" (it would shadow their constructor).
  const slotId = `tabby-card-slot-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const price = tabbyPrice(total, currency);
  // Primitives, not the config object: it is rebuilt on every render, and the
  // snippet must only be rebuilt when one of these values really changes.
  const scriptBase = config?.snippetScriptBase ?? null;
  const publicKey = config?.publicKey ?? "";
  const merchantCode = config?.merchantCode ?? "";
  const tabbyCurrency = config?.currency ?? currency;
  const key = scriptBase ? `${scriptBase}|${publicKey}|${merchantCode}|${price}|${tabbyCurrency}|${lang}` : null;
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptBase || !key) return;
    let cancelled = false;
    void loadTabbyCard(scriptBase)
      .then(() => {
        const host = hostRef.current;
        if (cancelled || !host || !window.TabbyCard) return;
        // Tabby renders nothing into an element React created, so it gets its
        // own element, replaced on every rebuild.
        const slot = document.createElement("div");
        slot.id = slotId;
        host.replaceChildren(slot);
        new window.TabbyCard({
          selector: `#${slotId}`,
          currency: tabbyCurrency,
          price,
          lang,
          shouldInheritBg: false,
          publicKey,
          merchantCode,
        });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, scriptBase, publicKey, merchantCode, tabbyCurrency, slotId, price, lang]);

  if (!key || failedKey === key) {
    return <p className={payOptNote}>{tabbyFallbackText(total, currency, lang)}</p>;
  }
  // Tabby's snippet needs at least 320px.
  return <div ref={hostRef} className="min-w-[320px] max-[420px]:-ms-8" dir={textDirection(lang)} />;
}
