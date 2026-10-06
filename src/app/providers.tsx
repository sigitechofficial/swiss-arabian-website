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

export function AppProviders({ children }: { children: ReactNode }) {
  return (
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
  );
}
