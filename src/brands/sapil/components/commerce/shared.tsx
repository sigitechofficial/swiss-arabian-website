"use client";

import { Fragment, useCallback, type ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";
import type { MoneyParts } from "@/lib/format/money";
import type { SapilLinkProps } from "../../ui/shared";
import { formatSapilPrice, formatSapilPriceParts } from "../shared/money";

/** The kit's link slot, rendered as a locale-aware Next link. */
export function SapilLink({ href, ...rest }: SapilLinkProps) {
  return <LocaleLink href={href} {...rest} />;
}

export type SapilMoney = (amount: number | null | undefined, currency: string) => string;

/**
 * Prices in the page's language, with the currency's own decimals (see
 * `sapilMoneyOptions`): "AED 63", "AED 19.75", "KWD 10.120" in English; `Intl`
 * currency format in other languages. Empty for a missing amount.
 */
export function useSapilMoney(): SapilMoney {
  const locale = useShopLocale();
  return useCallback<SapilMoney>(
    (amount, currency) => (amount == null ? "" : formatSapilPrice(amount, currency, locale)),
    [locale],
  );
}

/**
 * A total split for the v9 grand-total row: `<small>AED</small> 105` in English; the
 * language's own currency sign elsewhere ("د.إ." in Arabic).
 */
export function useSapilMoneyParts() {
  const locale = useShopLocale();
  return useCallback(
    (amount: number, currency: string): MoneyParts =>
      formatSapilPriceParts(amount, currency, locale) ?? { currency, amount: "" },
    [locale],
  );
}

/**
 * Dates in the page's language (e.g. "13 November 2026"), in the market's
 * time zone (Dubai time for the UAE), so every page and device agrees.
 */
export function useSapilDate() {
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  return useCallback(
    (iso: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) => {
      if (!iso) return "";
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "";
      try {
        return date.toLocaleDateString(intlLocale(locale), { timeZone, ...options });
      } catch {
        return date.toDateString();
      }
    },
    [locale, timeZone],
  );
}

/**
 * A translated sentence with elements in it: `{terms}` placeholders in the
 * template are replaced by the given nodes ("Agree to our {terms}").
 */
export function richText(template: string, parts: Record<string, ReactNode>): ReactNode {
  const pieces = template.split(/\{(\w+)\}/g);
  return pieces.map((piece, index) =>
    index % 2 === 1 && piece in parts ? <Fragment key={index}>{parts[piece]}</Fragment> : piece,
  );
}

/** The bottle tint for a line until the API sends `tileColor` (feat/sapil-cms). */
export const DEFAULT_TILE = "sand" as const;

/** Pastel tile with a soft pulse: the v9 loading state. */
export function SapilSkeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded-sapil-sm bg-sapil-p-sand motion-safe:animate-pulse ${className}`} />;
}
