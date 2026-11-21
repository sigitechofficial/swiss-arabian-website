import { cache } from "react";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";
import type { StorefrontMarketLanguage } from "@/features/markets/types/market";
import { DEFAULT_LOCALE, localeConfigFromMarket, type LocaleConfig } from "./locales";

/** A market's languages (as the market list gives them) → its website languages, default first. */
export function marketLocaleConfig(
  languages: readonly StorefrontMarketLanguage[] | null | undefined,
): LocaleConfig {
  const ordered = [...(languages ?? [])].sort(
    (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)),
  );
  return localeConfigFromMarket(ordered.map((l) => l.locale || l.languageCode));
}

/**
 * The languages of the market this page tree is for (admin: Markets → languages),
 * once per render. No request data is read (the market comes from the address and
 * the `[site]` root param), so pages stay static per address and market.
 */
export const serverLocaleConfig = cache(async (): Promise<LocaleConfig> => {
  const resolved = await resolveCatalogMarketFor(DEFAULT_LOCALE);
  return marketLocaleConfig(resolved.languages);
});
