const ZONE_TO_ISO: Record<string, string> = {
  UAE: "AE",
  KSA: "SA",
  KWT: "KW",
  QAT: "QA",
  BHR: "BH",
  OMN: "OM",
};

function isoToFlagEmoji(iso: string): string | undefined {
  const code = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return undefined;
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...[...code].map((char) => base + char.charCodeAt(0) - 65),
  );
}

const LOCAL_FLAG_ISOS = new Set(["ae", "sa", "kw", "qa", "bh", "om"]);

export function isoForMarket(input: {
  zoneCode?: string | null;
  countryCode?: string | null;
}): string | undefined {
  const fromCountry = input.countryCode?.trim().toUpperCase();
  if (fromCountry && /^[A-Z]{2}$/.test(fromCountry)) return fromCountry;

  const zone = input.zoneCode?.trim().toUpperCase() ?? "";
  if (ZONE_TO_ISO[zone]) return ZONE_TO_ISO[zone];
  if (/^[A-Z]{2}$/.test(zone)) return zone;
  return undefined;
}

export function flagImageSrc(iso: string): string {
  const code = iso.trim().toLowerCase();
  if (LOCAL_FLAG_ISOS.has(code)) return `/flags/${code}.svg`;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function flagForMarket(input: {
  zoneCode?: string | null;
  countryCode?: string | null;
}): string | undefined {
  const iso = isoForMarket(input);
  return iso ? isoToFlagEmoji(iso) : undefined;
}
