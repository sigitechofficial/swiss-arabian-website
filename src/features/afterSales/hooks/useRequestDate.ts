"use client";

import { useCallback } from "react";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import { formatMarketDate } from "@/lib/format/marketDate";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";

/** A return or exchange request's date: short "en-AE" in English, the page's language otherwise (market time zone). */
export function useRequestDate() {
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  return (iso: string) =>
    locale === "en"
      ? formatMarketDate(iso, "en-AE", timeZone, { year: "numeric", month: "short", day: "numeric" })
      : formatOrderDate(iso, { locale, timeZone });
}

/** The last day to ask for a return / exchange, long form in the page's language and market time zone. */
export function useLastDayFormat() {
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  return useCallback((iso: string) => formatOrderDate(iso, { long: true, locale, timeZone }), [locale, timeZone]);
}
