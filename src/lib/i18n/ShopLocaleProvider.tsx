"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "./localePath";
import type { ShopLocale } from "./locales";
import {
  createTranslator,
  englishTranslator,
  type MessageDictionary,
  type Translator,
} from "./messages";

type ShopLocaleContextValue = { locale: ShopLocale; t: Translator };

const ShopLocaleContext = createContext<ShopLocaleContextValue | null>(null);

/**
 * The page's language and its messages, from the `[locale]` route (server).
 * Client components read them with `useShopCopy()` / `useShopLocale()`.
 */
export function ShopLocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: ShopLocale;
  messages: MessageDictionary;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, t: createTranslator(locale, messages) }),
    [locale, messages],
  );
  return <ShopLocaleContext.Provider value={value}>{children}</ShopLocaleContext.Provider>;
}

/** The page's locale (route param); the address's language outside the provider. */
export function useShopLocale(): ShopLocale {
  const context = useContext(ShopLocaleContext);
  const pathname = usePathname() || "/";
  return context?.locale ?? localeFromPathname(pathname);
}

/** `t(key, values?)` in the page's language (English outside the provider). */
export function useShopTranslator(): Translator {
  return useContext(ShopLocaleContext)?.t ?? englishTranslator;
}
