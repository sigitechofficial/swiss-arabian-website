"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AuthSessionProvider } from "@/providers/AuthSessionProvider";
import { CartSessionProvider } from "@/providers/CartSessionProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { MarketProvider } from "@/providers/MarketProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";
import { StorefrontHostProvider } from "@/lib/storefront/StorefrontHostProvider";

export function AppProviders({
  children,
  storefrontHost,
}: {
  children: ReactNode;
  /** Address the page was requested on (local brand aliases, e.g. sp.localhost). */
  storefrontHost: string | null;
}) {
  return (
    <StorefrontHostProvider host={storefrontHost}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <QueryProvider>
            <LocaleProvider>
              <MarketProvider>
                <AuthSessionProvider>
                  <CartSessionProvider>
                    {children}
                    <Toaster />
                  </CartSessionProvider>
                </AuthSessionProvider>
              </MarketProvider>
            </LocaleProvider>
          </QueryProvider>
        </MotionConfig>
      </ThemeProvider>
    </StorefrontHostProvider>
  );
}
