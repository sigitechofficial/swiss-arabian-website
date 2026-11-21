import type { Metadata } from "next";
import { headers } from "next/headers";
import { AnalyticsScripts } from "@/components/layout/AnalyticsScripts";
import { getBrandConfig, localized } from "@/lib/brand";
import { loadRequestBrandIdentity } from "@/lib/seo/catalogPage";
import { SHOP_LOCALE_HEADER, SHOP_LOCALES_HEADER } from "@/lib/i18n/localeRouting";
import { dir, localeConfigFromMarket, toLocale } from "@/lib/i18n/locales";
import { getTranslator, loadMessages } from "@/lib/i18n/messages";
import { BrandHead } from "@brand-ui";
import { NotFoundView, StorefrontShell } from "@brand-ui/client";
import { AppProviders } from "./providers";
import { resolveStorefrontHost } from "@/lib/api/storefrontHost";
import { loadSiteIntegrations } from "@/lib/site/siteIntegrations";
import { DEFAULT_MARKET_TIME_ZONE } from "@/lib/storefront/marketTimeZone";
import "./globals.css";

/**
 * Server-rendered 404 for addresses no route matches (`experimental.globalNotFound`).
 *
 * The root layout lives under `[locale]`, so Next.js cannot compose a 404 from
 * it for an unmatched URL (it sends its bare error document; the shop's 404
 * only appeared after hydration). This page is a full document instead: the
 * brand's chrome and 404 view, in the address's language (the proxy passes it
 * in a request header), with a real 404 status.
 *
 * `notFound()` inside a page (unknown product, collection …) still renders
 * `[locale]/not-found.tsx` (404 status; drawn on the client).
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = toLocale((await headers()).get(SHOP_LOCALE_HEADER));
  const t = await getTranslator(locale);
  // Same site name and icon as every other page (SEO Management → Brand identity).
  const brand = await loadRequestBrandIdentity(locale).catch(() => null);
  const config = getBrandConfig();
  const siteName = brand?.name || localized(config.siteName, locale, config.defaultLocale);
  return {
    title: `${t("notFound.title")} – ${siteName}`,
    icons: {
      icon: brand?.favicon || config.icons.favicon,
      apple: brand?.favicon || config.icons.appleTouchIcon,
    },
    robots: { index: false, follow: false },
  };
}

export default async function GlobalNotFound() {
  const requestHeaders = await headers();
  const locale = toLocale(requestHeaders.get(SHOP_LOCALE_HEADER));
  // The market's languages, set by the proxy (default first).
  const localeConfig = localeConfigFromMarket(
    (requestHeaders.get(SHOP_LOCALES_HEADER) ?? "").split(","),
  );
  const [messages, integrations] = await Promise.all([
    loadMessages(locale),
    // The address's analytics still count a missing page (ADR-005 phase E).
    resolveStorefrontHost().then(loadSiteIntegrations),
  ]);
  return (
    <html lang={locale} dir={dir(locale)} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <BrandHead />
      </head>
      <body className="flex min-h-dvh flex-col">
        <AnalyticsScripts ids={integrations.analytics} />
        <AppProviders
          storefrontHost={null}
          locale={locale}
          messages={messages}
          localeConfig={localeConfig}
          integrations={integrations}
          // No market on a 404: the home market's zone (the page shows no dates).
          marketTimeZone={DEFAULT_MARKET_TIME_ZONE}
        >
          <StorefrontShell>
            <NotFoundView />
          </StorefrontShell>
        </AppProviders>
      </body>
    </html>
  );
}
