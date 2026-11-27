"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { notifyConsentReaders, setMarketConsentRequired } from "@/lib/consent/consent";
import { SITE_INTEGRATIONS_OFF, type SiteIntegrations } from "./siteIntegrations.types";

const SiteIntegrationsContext = createContext<SiteIntegrations>(SITE_INTEGRATIONS_OFF);

/** The address's integration settings, read once on the server by the root layout. */
export function SiteIntegrationsProvider({
  value,
  children,
}: {
  value: SiteIntegrations;
  children: ReactNode;
}) {
  // The market's consent rule, known before any child effect tracks (render-time, browser only,
  // idempotent); the effect then tells components that rendered with the old rule.
  setMarketConsentRequired(value.consentRequired);
  useEffect(() => {
    notifyConsentReaders();
  }, [value.consentRequired]);
  return <SiteIntegrationsContext.Provider value={value}>{children}</SiteIntegrationsContext.Provider>;
}

/** What this website may load (analytics, Insider tag, pay-later promos, Maps). Off outside the provider. */
export function useSiteIntegrations(): SiteIntegrations {
  return useContext(SiteIntegrationsContext);
}
