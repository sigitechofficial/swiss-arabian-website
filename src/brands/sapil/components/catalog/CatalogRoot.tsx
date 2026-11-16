import type { ReactNode } from "react";

/**
 * Layout box around a catalog page. The Sapil shell (`StorefrontShell` override)
 * already provides `SapilRoot` (tokens, fonts) and the theme stylesheet around
 * every page, so this only keeps the page filling the main column.
 */
export function CatalogRoot({ children }: { children: ReactNode }) {
  return <div className="flex-1">{children}</div>;
}
