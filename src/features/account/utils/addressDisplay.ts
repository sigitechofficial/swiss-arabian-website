import { intlLocale } from "@/lib/i18n/locales";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import type { CountryRegionSet } from "../data/regionsByCountry";
import { countryNameForCode } from "../schemas/addressBook.schema";

/**
 * Address wording in the page's language. Saved values stay as the API keeps
 * them (English region names, ISO country codes); only what is shown changes.
 * English reads exactly as before.
 */
export function countryLabel(code: string | null | undefined, locale: string, saved?: string | null): string {
  const english = saved || countryNameForCode(code ?? "");
  if (locale === "en" || !code) return english;
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: "region" }).of(code.toUpperCase()) ?? english;
  } catch {
    return english;
  }
}

const REGION_KIND: Record<string, { label: MessageKey; placeholder: MessageKey }> = {
  Emirate: { label: "address.kind.emirate", placeholder: "address.kind.emirateSelect" },
  Region: { label: "address.kind.region", placeholder: "address.kind.regionSelect" },
  Municipality: { label: "address.kind.municipality", placeholder: "address.kind.municipalitySelect" },
  Governorate: { label: "address.kind.governorate", placeholder: "address.kind.governorateSelect" },
};

export function regionSetLabels(set: CountryRegionSet, t: Translator): { label: string; placeholder: string } {
  const kind = REGION_KIND[set.label];
  return kind ? { label: t(kind.label), placeholder: t(kind.placeholder) } : { label: set.label, placeholder: set.placeholder };
}

/** A region's name (`address.region.<country>.<English name>`), or the saved name. */
export function regionLabel(countryCode: string, region: string, t: Translator): string {
  const key = `address.region.${countryCode}.${region}` as MessageKey;
  const text = t(key);
  return text === key ? region : text;
}
