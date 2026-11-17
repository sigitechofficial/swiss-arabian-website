/**
 * Dates on the website, formatted the same on the server and in the browser.
 *
 * `timeZone` is required: without it the server (UTC) and the shopper's device format the
 * same moment as different days, and React throws hydration error #418. Components get it
 * from `useMarketTimeZone()`; the locale tag is the page's (never the device's).
 */
export function formatMarketDate(
  value: string | Date | null | undefined,
  localeTag: string,
  timeZone: string,
  options: Omit<Intl.DateTimeFormatOptions, "timeZone">,
): string {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag, { ...options, timeZone }).format(date);
}
