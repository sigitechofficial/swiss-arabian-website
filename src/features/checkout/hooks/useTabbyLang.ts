"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { tabbyLang, type TabbyLang } from "../utils/tabby";

/**
 * Language for Tabby's wording and snippets: the page language (`<html lang>`).
 * Checkout pages carry it in their address; Tabby's fixed return address gets it
 * from the `?lang=` our return links carry (see `localeRouting`).
 */
export function useTabbyLang(): TabbyLang {
  const hydrated = useHydrated();
  return hydrated ? tabbyLang(document.documentElement.lang) : "en";
}
