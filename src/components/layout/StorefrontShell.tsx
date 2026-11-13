import type { ReactNode } from "react";
import { SkipLink } from "./SkipLink";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import { GiftChoiceHost } from "@/features/promotions/components/GiftChoiceHost";
import type { NavbarVariant } from "./navbar";
import { SearchOverlay } from "./SearchOverlay";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { siteHeaderSpacer, skipLink } from "@/styles/siteChrome";

export function StorefrontShell({
  children,
  /**
   * Finalized site header — the LP5 "boutique" chrome: chocolate ticker,
   * pill search, centered full lockup, labeled account / wishlist / bag.
   * `/lp/[id]` still passes its own variant so the header showcase keeps
   * rendering every option.
   */
  navbarVariant = "minimal",
  beforeFooter,
}: {
  children: ReactNode;
  navbarVariant?: NavbarVariant;
  /** Server content just above the footer (market SEO text). */
  beforeFooter?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--cream)] font-sans text-[var(--ink)]">
      <SkipLink className={skipLink} />
      <SiteHeader key="site-header" variant={navbarVariant} />
      <div className={siteHeaderSpacer} aria-hidden="true" />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      {beforeFooter}
      <SiteFooter />
      <CartSideSheet />
      <GiftChoiceHost />
      <SearchOverlay />
    </div>
  );
}
