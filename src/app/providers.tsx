"use client";

import type { ReactNode } from "react";
import { EmotionCacheProvider } from "@/providers/EmotionCacheProvider";
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
                {children}
                <Toaster />
              </MarketProvider>
            </LocaleProvider>
          </QueryProvider>
        </MuiProvider>
      </ThemeProvider>
    </EmotionCacheProvider>
  );
}
