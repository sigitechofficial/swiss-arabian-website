import { formatMarketDate } from "@/lib/format/marketDate";
import { intlLocale } from "@/lib/i18n/locales";

/** English rewards pages use the day-first British format ("05 Nov 2026"). */
function rewardsLocaleTag(locale: string): string {
  return locale === "en" ? "en-GB" : intlLocale(locale);
}

/** A rewards activity, history or sync date ("05 Nov 2026"); null when there is none. */
export function rewardsDate(value: string | null, locale: string, timeZone: string): string | null {
  if (!value) return null;
  return (
    formatMarketDate(value, rewardsLocaleTag(locale), timeZone, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) || null
  );
}

/** The day points become usable ("12 December"); null when there is none. */
export function rewardsVestingDate(value: string | null, locale: string, timeZone: string): string | null {
  if (!value) return null;
  return (
    formatMarketDate(value, rewardsLocaleTag(locale), timeZone, { day: "numeric", month: "long" }) || null
  );
}

/** When the employee benefits were last refreshed, with the time ("05 Nov 2026, 14:30"). */
export function rewardsSyncedAt(value: string | null, locale: string, timeZone: string): string | null {
  if (!value) return null;
  return (
    formatMarketDate(value, rewardsLocaleTag(locale), timeZone, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) || null
  );
}
