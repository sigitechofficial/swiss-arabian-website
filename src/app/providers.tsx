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
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { ShopLocale } from "@/lib/i18n/locales";
import type { MessageDictionary } from "@/lib/i18n/messages";

export function AppProviders({
  children,
  storefrontHost,
  locale,
  messages,
}: {
  children: ReactNode;
  /** Address the page was requested on (local brand aliases in development, e.g. sp.localhost). */
  storefrontHost: string | null;
  /** The `[locale]` route segment and its UI messages. */
  locale: ShopLocale;
  messages: MessageDictionary;
}) {
  return (
    <ShopLocaleProvider locale={locale} messages={messages}>
    <StorefrontHostProvider host={storefrontHost}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <QueryProvider>
            <LocaleProvider locale={locale}>
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
    </ShopLocaleProvider>
  );
}
