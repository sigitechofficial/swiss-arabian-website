"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "./localePath";
import { setPageTranslator } from "./pageTranslator";
import { setActiveLocaleConfig } from "./activeLocaleConfig";
import { fallbackLocaleConfig, type LocaleConfig, type ShopLocale } from "./locales";
import {
  createTranslator,
  englishTranslator,
  type MessageDictionary,
  type Translator,
} from "./messages";

type ShopLocaleContextValue = { locale: ShopLocale; t: Translator; localeConfig: LocaleConfig };

const ShopLocaleContext = createContext<ShopLocaleContextValue | null>(null);

/**
 * The page's language and its messages, from the `[locale]` route (server), and
 * the languages of the page's market (admin: Markets → languages).
 * Client components read them with `useShopCopy()` / `useShopLocale()` /
 * `useLocaleConfig()`.
 */
export function ShopLocaleProvider({
  locale,
  messages,
  localeConfig,
  children,
}: {
  locale: ShopLocale;
  messages: MessageDictionary;
  /** The page market's languages; the build fallback only where no market is known (tests). */
  localeConfig?: LocaleConfig;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: createTranslator(locale, messages),
      localeConfig: localeConfig ?? fallbackLocaleConfig(),
    }),
    [locale, messages, localeConfig],
  );
  // Browser code outside render (event handlers) reads the market languages too.
  setActiveLocaleConfig(value.localeConfig);
  // Error toasts and background bag sync speak the page's language too.
  useEffect(() => setPageTranslator(value.t), [value.t]);
  return <ShopLocaleContext.Provider value={value}>{children}</ShopLocaleContext.Provider>;
}

/** The page's locale (route param); the address's language outside the provider. */
export function useShopLocale(): ShopLocale {
  const context = useContext(ShopLocaleContext);
  const pathname = usePathname() || "/";
  return context?.locale ?? localeFromPathname(pathname, fallbackLocaleConfig());
}

/** The languages of the page's market, its default (unprefixed) first. */
export function useLocaleConfig(): LocaleConfig {
  return useContext(ShopLocaleContext)?.localeConfig ?? fallbackLocaleConfig();
}

/** `t(key, values?)` in the page's language (English outside the provider). */
export function useShopTranslator(): Translator {
  return useContext(ShopLocaleContext)?.t ?? englishTranslator;
}
