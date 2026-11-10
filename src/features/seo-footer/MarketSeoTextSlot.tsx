"use client";

import { usePathname } from "next/navigation";
import { pageRendersOwnSeoText } from "./seoTextOwner";

/**
 * Layout slot for the market SEO text. Empty on pages that render the block
 * themselves (collection pages), so a page never shows two SEO text blocks —
 * also after client-side navigation, where the layout is not re-rendered.
 */
export function MarketSeoTextSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pageRendersOwnSeoText(pathname)) return null;
  return <>{children}</>;
}
