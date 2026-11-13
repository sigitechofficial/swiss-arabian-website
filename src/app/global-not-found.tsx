import type { Metadata } from "next";
import { headers } from "next/headers";
import { AnalyticsScripts } from "@/components/layout/AnalyticsScripts";
import { getBrandConfig, localized } from "@/lib/brand";
import { loadRequestBrandIdentity } from "@/lib/seo/catalogPage";
import { SHOP_LOCALE_HEADER } from "@/lib/i18n/localeRouting";
import { dir, toLocale } from "@/lib/i18n/locales";
import { getTranslator, loadMessages } from "@/lib/i18n/messages";
import { BrandHead } from "@brand-ui";
import { NotFoundView, StorefrontShell } from "@brand-ui/client";
import { AppProviders } from "./providers";
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
  const locale = toLocale((await headers()).get(SHOP_LOCALE_HEADER));
  const messages = await loadMessages(locale);
  return (
    <html lang={locale} dir={dir(locale)} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <BrandHead />
      </head>
      <body className="flex min-h-dvh flex-col">
        <AnalyticsScripts />
        <AppProviders storefrontHost={null} locale={locale} messages={messages}>
          <StorefrontShell>
            <NotFoundView />
          </StorefrontShell>
        </AppProviders>
      </body>
    </html>
  );
}
