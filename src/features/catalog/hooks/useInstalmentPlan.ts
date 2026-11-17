"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";
import {
  instalmentProviders,
  payInFour,
  type InstalmentProvider,
} from "../utils/instalments";

/**
 * Our own pay-in-4 block under a price, shared by every brand: the four
 * payments, the providers it lists and which provider's details are open
 * (focus goes back to the opener on close).
 *
 * Tabby is never part of it: Tabby is shown with Tabby's official snippet
 * (`TabbyPromoSnippet`), because a fixed "4 payments, 0% interest" promise can
 * contradict the plans and fees Tabby really offers (Tabby QA, Nov 2026).
 */
/** Providers our own pay-in-4 block can list (Tabby has its official snippet). */
export type CustomInstalmentProvider = Exclude<InstalmentProvider, "tabby">;

export function useInstalmentPlan(price: number) {
  const [open, setOpen] = useState<CustomInstalmentProvider | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const payments = useMemo(() => payInFour(price), [price]);
  const promos = useSiteIntegrations().paymentPromos;
  const live = instalmentProviders(promos);

  const openProvider = useCallback((provider: CustomInstalmentProvider, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? null;
    setOpen(provider);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    openerRef.current?.focus();
  }, []);

  // Only what this market's checkout offers (ADR-005 phase E): the page never
  // advertises a way to pay the shopper can't pick at checkout (SE-8). Tabby
  // is left to its official snippet.
  const providers = (Object.keys(live) as InstalmentProvider[])
    .filter((id): id is CustomInstalmentProvider => id !== "tabby" && live[id].live)
    .map((id) => ({ id, ...live[id] }));

  return {
    payments,
    /** The first (and typical) payment. */
    each: payments[0],
    providers,
    /** False when the market offers no pay-in-4: hide the whole row. */
    available: providers.length > 0,
    open,
    openProvider,
    close,
  };
}
