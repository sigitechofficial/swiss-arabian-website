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
import { CountryMarketPrompt } from "@/features/markets/components/CountryMarketPrompt";
import { StorefrontHostProvider } from "@/lib/storefront/StorefrontHostProvider";
import { MarketTimeZoneProvider } from "@/lib/storefront/MarketTimeZoneProvider";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import type { LocaleConfig, ShopLocale } from "@/lib/i18n/locales";
import type { MessageDictionary } from "@/lib/i18n/messages";
import { SiteIntegrationsProvider } from "@/lib/site/SiteIntegrationsProvider";
import type { SiteIntegrations } from "@/lib/site/siteIntegrations.types";

export function AppProviders({
  children,
  storefrontHost,
  locale,
  messages,
  localeConfig,
  integrations,
  marketTimeZone,
}: {
  children: ReactNode;
  /** Address the page was requested on (local brand aliases in development, e.g. sp.localhost). */
  storefrontHost: string | null;
  /** The `[locale]` route segment and its UI messages. */
  locale: ShopLocale;
  messages: MessageDictionary;
  /** The languages of the page's market (admin: Markets → languages). */
  localeConfig: LocaleConfig;
  /** What this address may load (ADR-005 phase E), read by the root layout. */
  integrations: SiteIntegrations;
  /** The page market's time zone, decided by the server: dates read the same on both renders. */
  marketTimeZone: string;
}) {
  return (
    <SiteIntegrationsProvider value={integrations}>
    <ShopLocaleProvider locale={locale} messages={messages} localeConfig={localeConfig}>
    <StorefrontHostProvider host={storefrontHost}>
    <MarketTimeZoneProvider timeZone={marketTimeZone}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <QueryProvider>
            <LocaleProvider locale={locale}>
              <MarketProvider>
                <AuthSessionProvider>
                  <CartSessionProvider>
                    {children}
                    <Toaster />
                    <CountryMarketPrompt />
                  </CartSessionProvider>
                </AuthSessionProvider>
              </MarketProvider>
            </LocaleProvider>
          </QueryProvider>
        </MotionConfig>
      </ThemeProvider>
    </MarketTimeZoneProvider>
    </StorefrontHostProvider>
    </ShopLocaleProvider>
    </SiteIntegrationsProvider>
  );
}
