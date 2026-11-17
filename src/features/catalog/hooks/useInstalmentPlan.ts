"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import {
  instalmentProviders,
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
  const promos = useSiteIntegrations().paymentPromos;
  const tabbyUrl = tabbyPopupUrl(price, currency, locale, promos.tabby);
  const live = instalmentProviders(promos);

  const openProvider = useCallback((provider: InstalmentProvider, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? null;
    setOpen(provider);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  // Only what this market's checkout offers (ADR-005 phase E): the page never
  // advertises a way to pay the shopper can't pick at checkout (SE-8).
  const providers = (Object.keys(live) as InstalmentProvider[])
    .filter((id) => live[id].live)
    .map((id) => ({ id, ...live[id] }));

  return {
    payments,
    /** The first (and typical) payment. */
    each: payments[0],
    providers,
    /** False when the market offers no pay-in-4: hide the whole row. */
    available: providers.length > 0,
    tabbyUrl,
    open,
    /** Tabby's own pop-up applies (its currency is covered). */
    openTabbyPopup: open === "tabby" && Boolean(tabbyUrl),
    openProvider,
    close,
  };
}
