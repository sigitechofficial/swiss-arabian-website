"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { tabbyLang, type TabbyLang } from "../utils/tabby";

/**
 * Language for Tabby's wording and snippets. Checkout addresses carry no `/ar`
 * prefix, so the page language comes from `<html lang>` (set by the root layout).
 */
export function useTabbyLang(): TabbyLang {
  const hydrated = useHydrated();
  return hydrated ? tabbyLang(document.documentElement.lang) : "en";
}
