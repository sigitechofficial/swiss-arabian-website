/**
 * Whether to suggest the market of the shopper's current country: only when it
 * is one of the markets the picker offers, differs from the market in use, and
 * the shopper has not already said no to it. Never on checkout (switching there
 * changes the bag's prices mid-payment).
 */
export function countryMarketSuggestion(input: {
  countryMarket: string | null;
  currentMarket: string | null;
  offered: readonly string[];
  declined: string | null;
  pathname: string;
}): string | null {
  const { countryMarket, currentMarket, offered, declined, pathname } = input;
  if (!countryMarket || !currentMarket) return null;
  if (countryMarket === currentMarket || countryMarket === declined) return null;
  if (!offered.includes(countryMarket)) return null;
  if (/(?:^|\/)checkout(?:\/|$)/.test(pathname)) return null;
  return countryMarket;
}

/** The country's name in the page's language ("SA" -> "Saudi Arabia" / "السعودية"). */
export function countryDisplayName(countryCode: string | undefined, locale: string): string | null {
  if (!countryCode) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}
