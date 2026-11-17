"use client";

import { useEffect, useId, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import { tabbyLang } from "@/features/checkout/utils/tabby";
import { tabbyPromoConfig, tabbyPromoPrice, type TabbyPromoSource } from "./tabbyPromo";

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

/** Loads Tabby's `tabby-promo.js` once per Tabby host. */
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
 * (cart, mini cart). Nothing where the market has no Tabby, and nothing if
 * Tabby's script can't load: never home-made plan text in its place.
 * The container id is ours (Tabby: never `TabbyPromo` / `TabbyCard`).
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
  const lang = tabbyLang(useShopLocale());
  const config = tabbyPromoConfig(useSiteIntegrations().paymentPromos.tabby, amount, currency);
  const id = `tabby-promo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [failed, setFailed] = useState(false);
  const price = tabbyPromoPrice(amount, currency);
  const publicKey = config?.publicKey;
  const merchantCode = config?.merchantCode;
  const scriptBase = config?.scriptBase;
  const code = config?.currency;

  useEffect(() => {
    if (!hydrated || !publicKey || !merchantCode || !scriptBase || !code) return;
    let cancelled = false;
    loadTabbyPromo(scriptBase)
      .then(() => {
        const host = document.getElementById(id);
        if (cancelled || !window.TabbyPromo || !host) return;
        host.innerHTML = "";
        new window.TabbyPromo({
          selector: `#${id}`,
          currency: code,
          price,
          lang,
          source,
          shouldInheritBg: false,
          publicKey,
          merchantCode,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, id, price, lang, source, publicKey, merchantCode, scriptBase, code]);

  if (!hydrated || !config || failed) return null;
  return <div id={id} className={className} data-tabby-promo={source} />;
}
