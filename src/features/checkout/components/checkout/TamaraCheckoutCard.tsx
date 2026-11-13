"use client";

import { payOptNote } from "@/styles/checkoutChrome";
import { tamaraFallbackText, type TamaraLang } from "../../utils/tamara";
import { TamaraWidget } from "../TamaraWidget";

/**
 * Tamara's own widget, shown under the Tamara option while it is selected.
 * Rebuilt whenever the total, currency or language changes. Without a public
 * key, or if the script can't load, plain wording is shown instead.
 */
export function TamaraCheckoutCard({
  publicKey,
  total,
  currency,
  lang,
}: {
  publicKey: string;
  total: number;
  currency: string;
  lang: TamaraLang;
}) {
  return (
    <TamaraWidget
      amount={total}
      currency={currency}
      lang={lang}
      publicKey={publicKey}
      fallback={<p className={payOptNote}>{tamaraFallbackText(total, currency, lang)}</p>}
    />
  );
}
