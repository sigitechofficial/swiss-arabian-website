"use client";

import "@/brands/sapil/theme.css";
import { useEffect, useState, type ReactNode } from "react";
import type { NavbarVariant } from "@/components/layout/navbar";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { SapilCopyProvider, englishFallback } from "../../i18n/SapilCopy";
import { loadSapilMessages, type SapilDictionary } from "../../i18n/load";
import { SapilRoot } from "../../ui/SapilRoot";
import { SapilChrome } from "./SapilChrome";

/**
 * Sapil's `StorefrontShell` for client route files (error, not found). The
 * wording loads in the browser; English shows until it arrives.
 */
export function SapilStorefrontShellClient({
  children,
  beforeFooter,
}: {
  children: ReactNode;
  navbarVariant?: NavbarVariant;
  beforeFooter?: ReactNode;
}) {
  const locale = useShopLocale();
  const [loaded, setLoaded] = useState<{ locale: string; messages: SapilDictionary } | null>(null);
  useEffect(() => {
    let live = true;
    void loadSapilMessages(locale).then((messages) => {
      if (live) setLoaded({ locale, messages });
    });
    return () => {
      live = false;
    };
  }, [locale]);
  const messages = loaded && loaded.locale === locale ? loaded.messages : englishFallback;
  return (
    <SapilRoot className="flex min-h-dvh flex-col">
      <SapilCopyProvider messages={messages}>
        <SapilChrome beforeFooter={beforeFooter}>{children}</SapilChrome>
      </SapilCopyProvider>
    </SapilRoot>
  );
}
