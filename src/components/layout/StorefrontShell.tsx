import type { ReactNode } from "react";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import { AnnouncementBar } from "./AnnouncementBar";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-page font-sans text-sa-primary">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1 bg-page">{children}</main>
      <SiteFooter />
      <MobileNav />
      <CartSideSheet />
    </div>
  );
}
