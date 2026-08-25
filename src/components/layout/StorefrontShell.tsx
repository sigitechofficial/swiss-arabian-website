import type { ReactNode } from "react";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import { SearchOverlay } from "./SearchOverlay";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--cream)] font-sans text-[var(--ink)]">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <CartSideSheet />
      <SearchOverlay />
    </div>
  );
}
