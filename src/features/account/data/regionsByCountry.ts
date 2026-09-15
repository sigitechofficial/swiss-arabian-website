/** Admin-level regions keyed by ISO country — used until a storefront geo API exists. */

export type CountryRegionSet = {
  label: string;
  placeholder: string;
  regions: readonly string[];
};

const AE: CountryRegionSet = {
  label: "Emirate",
  placeholder: "Select emirate",
  regions: [
    "Abu Dhabi",
    "Dubai",
    "Sharjah",
    "Ajman",
    "Umm Al Quwain",
    "Ras Al Khaimah",
    "Fujairah",
  ],
};

const SA: CountryRegionSet = {
  label: "Region",
  placeholder: "Select region",
  regions: [
    "Riyadh",
    "Makkah",
    "Madinah",
    "Eastern Province",
    "Qassim",
    "Asir",
    "Tabuk",
    "Hail",
    "Northern Borders",
    "Jazan",
    "Najran",
    "Al Bahah",
    "Al Jawf",
  ],
};

const QA: CountryRegionSet = {
  label: "Municipality",
  placeholder: "Select municipality",
  regions: [
    "Doha",
    "Al Rayyan",
    "Al Wakrah",
    "Umm Salal",
    "Al Khor",
    "Al Daayen",
    "Al Shamal",
    "Al Shahaniya",
  ],
};

const KW: CountryRegionSet = {
  label: "Governorate",
  placeholder: "Select governorate",
  regions: [
    "Al Asimah",
    "Hawalli",
    "Farwaniya",
    "Mubarak Al-Kabeer",
    "Ahmadi",
    "Jahra",
  ],
};

const BH: CountryRegionSet = {
  label: "Governorate",
  placeholder: "Select governorate",
  regions: ["Capital", "Muharraq", "Northern", "Southern"],
};

const OM: CountryRegionSet = {
  label: "Governorate",
  placeholder: "Select governorate",
  regions: [
    "Muscat",
    "Dhofar",
    "Musandam",
    "Al Buraimi",
    "Ad Dakhiliyah",
    "Al Batinah North",
    "Al Batinah South",
    "Ash Sharqiyah North",
    "Ash Sharqiyah South",
    "Ad Dhahirah",
    "Al Wusta",
  ],
};

export const REGIONS_BY_COUNTRY: Record<string, CountryRegionSet> = {
  AE,
  SA,
  QA,
  KW,
  BH,
  OM,
};

/** Markets sometimes send alpha-3 / zone codes instead of ISO-2. */
const COUNTRY_ALIASES: Record<string, string> = {
  ARE: "AE",
  UAE: "AE",
  SAU: "SA",
  KSA: "SA",
  QAT: "QA",
  KWT: "KW",
  BHR: "BH",
  OMN: "OM",
};

const REGION_ALIASES: Record<string, string> = {
  "ad dawhah": "Doha",
  "ad dawha": "Doha",
  dawhah: "Doha",
  dawha: "Doha",
  "doha municipality": "Doha",
  "abu dhabi emirate": "Abu Dhabi",
  "dubai emirate": "Dubai",
  "sharjah emirate": "Sharjah",
  "ras al khaimah emirate": "Ras Al Khaimah",
  "umm al quwain emirate": "Umm Al Quwain",
  "makkah al mukarramah": "Makkah",
  "al riyadh": "Riyadh",
  "ash sharqiyah": "Eastern Province",
  "eastern": "Eastern Province",
  "al asimah": "Al Asimah",
  capital: "Al Asimah",
};

export function normalizeCountryCode(code?: string | null): string {
  const raw = code?.trim().toUpperCase() || "";
  if (!raw) return "";
  if (REGIONS_BY_COUNTRY[raw]) return raw;
  return COUNTRY_ALIASES[raw] ?? raw;
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function regionsForCountry(
  countryCode?: string | null,
): CountryRegionSet | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  return REGIONS_BY_COUNTRY[code] ?? null;
}

export function matchCountryRegion(
  countryCode: string | null | undefined,
  ...values: Array<string | null | undefined>
): string {
  const set = regionsForCountry(countryCode);
  for (const value of values) {
    if (!value?.trim()) continue;
    if (!set) return value.trim();
    const needle = fold(value)
      .replace(/^emirate of /, "")
      .replace(/ emirate$/, "")
      .replace(/ municipality$/, "")
      .replace(/ governorate$/, "");
    const aliased = REGION_ALIASES[needle];
    if (aliased && set.regions.includes(aliased)) return aliased;
    const exact = set.regions.find((region) => fold(region) === needle);
    if (exact) return exact;
    const partial = set.regions.find((region) => {
      const folded = fold(region);
      return needle.includes(folded) || folded.includes(needle);
    });
    if (partial) return partial;
  }
  return "";
}

export function regionChoices(
  set: CountryRegionSet | null,
  selected?: string | null,
): string[] {
  const regions = [...(set?.regions ?? [])];
  const extra = selected?.trim();
  if (extra && !regions.some((region) => region === extra)) {
    regions.unshift(extra);
  }
  return regions;
}

/** @deprecated Use regionsForCountry("AE") — kept for existing imports. */
export const UAE_EMIRATES = AE.regions;
