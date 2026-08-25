"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { EmotionCacheProvider } from "@/providers/EmotionCacheProvider";
import { AuthSessionProvider } from "@/providers/AuthSessionProvider";
import { CartSessionProvider } from "@/providers/CartSessionProvider";
import { LocaleProvider } from "@/providers/LocaleProvider";
import { MarketProvider } from "@/providers/MarketProvider";
import { MuiProvider } from "@/providers/MuiProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <EmotionCacheProvider>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <MuiProvider>
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
          </MuiProvider>
        </MotionConfig>
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}
