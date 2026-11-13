"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { formatMessage, type MessageValues } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { ENGLISH, type SapilCopyKey } from "./catalog";
import type { SapilDictionary } from "./load";

const SapilCopyContext = createContext<SapilDictionary | null>(null);

/** Sapil's wording for the page's language (loaded on the server by the Sapil shell). */
export function SapilCopyProvider({ messages, children }: { messages: SapilDictionary; children: ReactNode }) {
  return <SapilCopyContext.Provider value={messages}>{children}</SapilCopyContext.Provider>;
}

/** English wording (used until a language loads, and for missing keys). */
export const englishFallback: SapilDictionary = Object.fromEntries(
  Object.entries(ENGLISH).flatMap(([area, entries]) =>
    Object.entries(entries).map(([key, value]) => [`${area}.${key}`, value]),
  ),
) as SapilDictionary;

/** True inside a `SapilCopyProvider` (the Sapil shell / auth frame loaded the page's wording). */
export function useHasSapilCopy(): boolean {
  return useContext(SapilCopyContext) !== null;
}

export type SapilTranslator =(key: SapilCopyKey, values?: MessageValues) => string;

/** `t("area.key", values?)` for Sapil components (client). Shared wording stays on `useShopCopy()`. */
export function useSapilCopy(): SapilTranslator {
  const locale = useShopLocale();
  const messages = useContext(SapilCopyContext) ?? englishFallback;
  return useMemo(
    () => (key: SapilCopyKey, values?: MessageValues) => formatMessage(locale, messages, key, values),
    [locale, messages],
  );
}
