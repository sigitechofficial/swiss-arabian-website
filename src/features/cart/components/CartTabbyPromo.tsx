"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { TabbyDialog, payInFour, tabbyPopupUrl } from "@/features/catalog/components/pdp/PdpInstalments";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { brandIntegrations } from "@/lib/brand";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { pdpPayBtnMore, pdpPayMarkTabby } from "@/styles/pdpChrome";

/**
 * Tabby's cart-page promo: the bag total split in four, and Tabby's own
 * "Learn more" pop-up (the same one the product page opens).
 * Hidden when Tabby is off for this storefront or the currency isn't covered.
 */
export function CartTabbyPromo({ amount, currency }: { amount: number; currency: string }) {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const locale = localeFromPathname(usePathname() || "/");
  const close = useCallback(() => {
    setOpen(false);
    openerRef.current?.focus();
  }, []);

  if (!brandIntegrations().payments.tabby || !(amount > 0)) return null;
  const src = tabbyPopupUrl(amount, currency, locale);
  if (!src) return null;

  return (
    <>
      <button
        type="button"
        ref={openerRef}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-3 py-2.5 text-start text-sm"
      >
        <span className={pdpPayMarkTabby}>Tabby</span>
        <span className="min-w-0 flex-1">
          4 interest-free payments of <strong>{formatMoney(payInFour(amount)[0], currency)}</strong>
        </span>
        <span className={pdpPayBtnMore}>
          Learn more
          <ChevronRight size={14} aria-hidden="true" />
        </span>
      </button>
      {open ? <TabbyDialog src={src} onClose={close} /> : null}
    </>
  );
}
