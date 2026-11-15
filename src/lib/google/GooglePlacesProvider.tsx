"use client";

import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";

/** The address's Google Maps browser key, when Maps is on for its market (ADR-005 phase E). */
function useMapsApiKey(): string {
  return useSiteIntegrations().googleMaps?.browserKey ?? "";
}

/** Address autocomplete is available on this website. */
export function useGooglePlacesEnabled(): boolean {
  return Boolean(useMapsApiKey());
}

export function GooglePlacesProvider({ children }: { children: ReactNode }) {
  const apiKey = useMapsApiKey();
  if (!apiKey) return children;
  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      {children}
    </APIProvider>
  );
}
