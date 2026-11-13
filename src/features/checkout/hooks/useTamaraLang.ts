"use client";

import { useHydrated } from "@/hooks/useHydrated";
import { tamaraLang, type TamaraLang } from "../utils/tamara";

/** Language for Tamara's wording and widget, from `<html lang>` (checkout has no `/ar` prefix). */
export function useTamaraLang(): TamaraLang {
  const hydrated = useHydrated();
  return hydrated ? tamaraLang(document.documentElement.lang) : "en";
}
