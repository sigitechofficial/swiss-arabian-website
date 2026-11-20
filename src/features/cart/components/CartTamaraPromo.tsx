"use client";

import { usePathname } from "next/navigation";
import { TamaraWidget } from "@/features/checkout/components/TamaraWidget";
import { tamaraCountry, tamaraFallbackText, tamaraLang } from "@/features/checkout/utils/tamara";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import { pdpPayMarkTamara } from "@/styles/pdpChrome";

/**
 * Tamara's cart-page promo: Tamara's own widget v2 for the bag total (it opens
 * Tamara's "Learn more" pop-up itself). Without a public key, or if the script
 * can't load, a plain pay-in-4 line is shown instead.
 * Hidden unless the market's checkout offers Tamara (ADR-005 phase E) and the
 * currency is covered.
 */
export function CartTamaraPromo({ amount, currency }: { amount: number; currency: string }) {
  const lang = tamaraLang(localeFromPathname(usePathname() || "/"));

  const tamara = useSiteIntegrations().paymentPromos.tamara;

  if (!tamara || !(amount > 0) || !tamaraCountry(currency)) return null;

  return (
    <TamaraWidget
      amount={amount}
      currency={currency}
      lang={lang}
      publicKey={tamara.publicKey ?? ""}
      className="w-full"
      fallback={
        <p className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-3 py-2.5 text-start text-sm">
          <span className={pdpPayMarkTamara}>Tamara</span>
          <span className="min-w-0 flex-1">{tamaraFallbackText(amount, currency, lang)}</span>
        </p>
      }
    />
  );
}
