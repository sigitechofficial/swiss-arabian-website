"use client";

import type { ReactNode } from "react";
import { EmotionCacheProvider } from "@/providers/EmotionCacheProvider";
import { AuthSessionProvider } from "@/providers/AuthSessionProvider";
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
        <MuiProvider>
          <QueryProvider>
            <LocaleProvider>
              <MarketProvider>
                <AuthSessionProvider>
                  {children}
                  <Toaster />
                </AuthSessionProvider>
              </MarketProvider>
            </LocaleProvider>
          </QueryProvider>
        </MuiProvider>
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}
