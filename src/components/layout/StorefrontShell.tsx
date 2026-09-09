import type { ReactNode } from "react";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import type { NavbarVariant } from "./navbar";
import { SearchOverlay } from "./SearchOverlay";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StorefrontShell({
  children,
  navbarVariant = "classic",
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
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <CartSideSheet />
      <SearchOverlay />
    </div>
  );
}
