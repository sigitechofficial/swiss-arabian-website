"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import {
  INSTALMENT_PROVIDERS,
  payInFour,
  tabbyPopupUrl,
  type InstalmentProvider,
} from "../utils/instalments";

/**
 * Pay-in-4 (Tabby / Tamara) under a price, shared by every brand: the four
 * payments, the provider list, Tabby's own pop-up address for this price, and
 * which provider's details are open (focus goes back to the opener on close).
 */
export function useInstalmentPlan(price: number, currency: string) {
  const [open, setOpen] = useState<InstalmentProvider | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const locale = localeFromPathname(usePathname() || "/");
  const payments = useMemo(() => payInFour(price), [price]);
  const tabbyUrl = tabbyPopupUrl(price, currency, locale);

  const openProvider = useCallback((provider: InstalmentProvider, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? null;
    setOpen(provider);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  const providers = (Object.keys(INSTALMENT_PROVIDERS) as InstalmentProvider[]).map((id) => ({
    id,
    ...INSTALMENT_PROVIDERS[id],
  }));

  return {
    payments,
    /** The first (and typical) payment. */
    each: payments[0],
    providers,
    tabbyUrl,
    open,
    /** Tabby's own pop-up applies (its currency is covered). */
    openTabbyPopup: open === "tabby" && Boolean(tabbyUrl),
    openProvider,
    close,
  };
}
