"use client";

import { usePathname } from "next/navigation";
import { showsMarketSeoText } from "./seoTextOwner";

/**
 * Layout slot for the market SEO text: shown on the home page only (SEO audit
 * p6), so no other page repeats the home page's text. Path-based, so it is
 * also right after client-side navigation, where the layout is not re-rendered.
 */
export function MarketSeoTextSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (!showsMarketSeoText(pathname)) return null;
  return <>{children}</>;
}
