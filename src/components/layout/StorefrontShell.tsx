import type { ReactNode } from "react";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import { GiftChoiceHost } from "@/features/promotions/components/GiftChoiceHost";
import type { NavbarVariant } from "./navbar";
import { SearchOverlay } from "./SearchOverlay";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StorefrontShell({
  children,
  /**
   * Finalized site header — the LP5 "boutique" chrome: chocolate ticker,
   * pill search, centered full lockup, labeled account / wishlist / bag.
   * `/lp/[id]` still passes its own variant so the header showcase keeps
   * rendering every option.
   */
  navbarVariant = "minimal",
}: {
  children: ReactNode;
  navbarVariant?: NavbarVariant;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--cream)] font-sans text-[var(--ink)]">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader key="site-header" variant={navbarVariant} />
      <div className="site-header-spacer" aria-hidden="true" />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <CartSideSheet />
      <GiftChoiceHost />
      <SearchOverlay />
    </div>
  );
}
