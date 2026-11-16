"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { currentShopperLocale } from "@/lib/i18n/shopperLocale";
import type { TabbyLang } from "../utils/tabby";

/**
 * Language for Tabby's wording and snippets. Checkout addresses carry no `/ar`
 * prefix, so this is the page language when it is Arabic, else the language
 * the shopper last browsed the shop in (see `shopperLocale`).
 */
export function useTabbyLang(): TabbyLang {
  const hydrated = useHydrated();
  return hydrated ? currentShopperLocale() : "en";
}
