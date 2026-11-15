"use client";

import { useCallback } from "react";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { formatSapilPrice } from "./money";

/** `price(63, "AED")` → "AED 63" (en) / Intl in other languages. */
export function useSapilPrice() {
  const locale = useShopLocale();
  return useCallback((amount: number, currency: string) => formatSapilPrice(amount, currency, locale), [locale]);
}
