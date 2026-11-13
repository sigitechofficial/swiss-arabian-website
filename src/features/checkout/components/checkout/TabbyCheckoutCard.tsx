"use client";

import { dir as textDirection } from "@/lib/i18n/locales";
import { payOptNote } from "@/styles/checkoutChrome";
import { useTabbyCheckoutCard } from "../../hooks/useTabbyCheckoutCard";
import type { TabbyLang, TabbySnippetConfig } from "../../utils/tabby";

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
  const { hostRef, fallback } = useTabbyCheckoutCard({ config, total, currency, lang });
  if (fallback != null) {
    return <p className={payOptNote}>{fallback}</p>;
  }
  // Tabby's snippet needs at least 320px.
  return <div ref={hostRef} className="min-w-[320px] max-[420px]:-ms-8" dir={textDirection(lang)} />;
}
