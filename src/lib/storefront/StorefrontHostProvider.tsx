"use client";

import { createContext, useContext, type ReactNode } from "react";
import { storefrontLogo, type StorefrontLogo } from "./brand";

/**
 * The address the page was requested on (e.g. `sp.localhost:3004`). The server
 * render has no `window`, so components read the host from here: the first
 * render and the browser then pick the same brand (no logo flip on hydration).
 */
const StorefrontHostContext = createContext<string | null>(null);

export function StorefrontHostProvider({
  host,
  children,
}: {
  host: string | null;
  children: ReactNode;
}) {
  return (
    <StorefrontHostContext.Provider value={host}>
      {children}
    </StorefrontHostContext.Provider>
  );
}

export function useStorefrontHost(): string | null {
  return useContext(StorefrontHostContext);
}

export function useStorefrontLogo(): StorefrontLogo {
  return storefrontLogo(useStorefrontHost());
}
