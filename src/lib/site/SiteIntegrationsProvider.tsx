"use client";

import { createContext, useContext, type ReactNode } from "react";
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
  return <SiteIntegrationsContext.Provider value={value}>{children}</SiteIntegrationsContext.Provider>;
}

/** What this website may load (analytics, Insider tag, pay-later promos, Maps). Off outside the provider. */
export function useSiteIntegrations(): SiteIntegrations {
  return useContext(SiteIntegrationsContext);
}
