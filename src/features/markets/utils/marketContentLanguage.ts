import type { StorefrontMarketLanguage } from "../types/market";

function family(code: string | null | undefined): string {
  return (code ?? "").trim().toLowerCase().split(/[-_]/)[0] ?? "";
}

/**
 * The market's own code for the language the shopper is reading.
 *
 * The address carries "en" or "ar". A market registers the exact code it
 * publishes content under (for example "en-us"), and published content is
 * looked up by that exact code. The market's list is the source of truth, so
 * the shop asks with the market's code and not with the one in the address.
 *
 * Returns null when the market does not offer that language.
 */
export function marketContentLanguage(
  languages: readonly StorefrontMarketLanguage[] | null | undefined,
  pathLanguage: string,
): string | null {
  const wanted = family(pathLanguage);
  if (!wanted) return null;
  const offered = (languages ?? []).filter((language) => family(language.locale || language.languageCode) === wanted);
  const pick =
    offered.find((language) => (language.locale || language.languageCode).trim().toLowerCase() === wanted) ??
    offered.find((language) => language.isDefault) ??
    offered[0];
  return pick ? (pick.locale || pick.languageCode).trim() : null;
}
