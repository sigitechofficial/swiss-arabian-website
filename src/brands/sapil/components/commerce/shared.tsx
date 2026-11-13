"use client";

import { Fragment, useCallback, type ReactNode } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { formatAED, type SapilLinkProps } from "../../ui/shared";

/** The kit's link slot, rendered as a locale-aware Next link. */
export function SapilLink({ href, ...rest }: SapilLinkProps) {
  return <LocaleLink href={href} {...rest} />;
}

export type SapilMoney = (amount: number | null | undefined, currency: string) => string;

/**
 * Prices in the page's language. English keeps the v9 format ("AED 63",
 * "AED 19.75"); other languages use Intl for the market's currency.
 */
export function useSapilMoney(): SapilMoney {
  const locale = useShopLocale();
  return useCallback<SapilMoney>(
    (amount, currency) => {
      if (amount == null || !Number.isFinite(amount)) return "";
      if (locale === "en") return formatAED(amount, currency);
      try {
        const whole = Math.round(amount * 100) % 100 === 0;
        return new Intl.NumberFormat(intlLocale(locale), {
          style: "currency",
          currency,
          minimumFractionDigits: whole ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return formatAED(amount, currency);
      }
    },
    [locale],
  );
}

/** A total split for the v9 grand-total row: `<small>AED</small> 105`. */
export function useSapilMoneyParts() {
  const locale = useShopLocale();
  return useCallback(
    (amount: number, currency: string) => {
      const whole = Math.round(amount * 100) % 100 === 0;
      let number: string;
      try {
        number = new Intl.NumberFormat(locale === "en" ? "en-US" : intlLocale(locale), {
          minimumFractionDigits: whole ? 0 : 2,
          maximumFractionDigits: 2,
          useGrouping: locale !== "en",
        }).format(amount);
      } catch {
        number = amount.toFixed(whole ? 0 : 2);
      }
      return { currency, amount: number };
    },
    [locale],
  );
}

/** Dates in the page's language (e.g. "13 November 2026"). */
export function useSapilDate() {
  const locale = useShopLocale();
  return useCallback(
    (iso: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) => {
      if (!iso) return "";
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "";
      try {
        return date.toLocaleDateString(intlLocale(locale), options);
      } catch {
        return date.toDateString();
      }
    },
    [locale],
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
