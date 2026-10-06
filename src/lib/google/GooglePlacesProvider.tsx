"use client";

import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { env } from "@/lib/config/env";

export function googlePlacesEnabled(): boolean {
  return Boolean(env.googleMapsApiKey);
}

export function GooglePlacesProvider({ children }: { children: ReactNode }) {
  if (!env.googleMapsApiKey) return children;
  return (
    <APIProvider apiKey={env.googleMapsApiKey} libraries={["places"]}>
      {children}
    </APIProvider>
  );
}
