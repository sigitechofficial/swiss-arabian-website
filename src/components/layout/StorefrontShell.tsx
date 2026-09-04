import type { ReactNode } from "react";
import { CartSideSheet } from "@/features/cart/components/CartSideSheet";
import { WishlistStatusScope } from "@/features/wishlist/components/WishlistStatusScope";
import { AnnouncementBar } from "./AnnouncementBar";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <WishlistStatusScope>
      <div className="flex min-h-dvh flex-col bg-page font-sans text-sa-primary">
        <AnnouncementBar />
        <SiteHeader />
        <main className="flex flex-1 flex-col bg-page">{children}</main>
        <SiteFooter />
        <MobileNav />
        <CartSideSheet />
      </div>
    </WishlistStatusScope>
  );
}
