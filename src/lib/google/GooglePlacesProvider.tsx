"use client";

import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { brandIntegrations } from "@/lib/brand";

function mapsApiKey(): string {
  return brandIntegrations().googleMaps.apiKey;
}

export function googlePlacesEnabled(): boolean {
  return Boolean(mapsApiKey());
}

export function GooglePlacesProvider({ children }: { children: ReactNode }) {
  const apiKey = mapsApiKey();
  if (!apiKey) return children;
  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      {children}
    </APIProvider>
  );
}
