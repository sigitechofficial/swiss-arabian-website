"use client";

import { useEffect, useId, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { currentShopperLocale } from "@/lib/i18n/shopperLocale";
import { usableTabbyPromo, useTabbyPromoConfig, type TabbyPromoSource } from "./tabbyPromo";

type TabbyPromoOptions = {
  selector: string;
  currency: string;
  price: string;
  lang: "en" | "ar";
  source: TabbyPromoSource;
  shouldInheritBg?: boolean;
  publicKey: string;
  merchantCode: string;
};

declare global {
  interface Window {
    TabbyPromo?: new (options: TabbyPromoOptions) => unknown;
  }
}

const LOAD_TIMEOUT_MS = 8000;

/** Loads Tabby's `tabby-promo.js` once per script host. */
function loadTabbyPromo(scriptBase: string): Promise<void> {
  if (window.TabbyPromo) return Promise.resolve();
  const src = `${scriptBase}/tabby-promo.js`;
  let script = document.querySelector<HTMLScriptElement>(`script[data-tabby-promo="${src}"]`);
  if (!script) {
    script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.tabbyPromo = src;
    document.head.appendChild(script);
  }
  const element = script;
  return new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.TabbyPromo) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - started > LOAD_TIMEOUT_MS) {
        window.clearInterval(timer);
        reject(new Error("Tabby promo did not load"));
      }
    }, 100);
    element.addEventListener(
      "error",
      () => {
        window.clearInterval(timer);
        reject(new Error("Tabby promo failed to load"));
      },
      { once: true },
    );
  });
}

/**
 * Tabby's official promo snippet for a price (product page) or a bag total
 * (cart, mini cart). Renders nothing where Tabby isn't offered, and nothing
 * if Tabby's script can't load: no home-made plan text in its place.
 */
export function TabbyPromoSnippet({
  amount,
  currency,
  source,
  className,
}: {
  amount: number;
  currency: string;
  source: TabbyPromoSource;
  className?: string;
}) {
  const hydrated = useHydrated();
  const config = usableTabbyPromo(useTabbyPromoConfig(), amount, currency);
  const id = `tabby-promo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [failed, setFailed] = useState(false);
  const lang = hydrated ? currentShopperLocale() : "en";
  const price = amount.toFixed(currency.toUpperCase() === "KWD" ? 3 : 2);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    loadTabbyPromo(config.snippetScriptBase)
      .then(() => {
        if (cancelled || !window.TabbyPromo || !document.getElementById(id)) return;
        document.getElementById(id)!.innerHTML = "";
        new window.TabbyPromo({
          selector: `#${id}`,
          currency: config.currency,
          price,
          lang,
          source,
          shouldInheritBg: false,
          publicKey: config.publicKey,
          merchantCode: config.merchantCode,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [config, id, price, lang, source]);

  if (!hydrated || !config || failed) return null;
  return <div id={id} className={className} data-tabby-promo={source} />;
}
