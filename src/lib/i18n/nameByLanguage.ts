import { baseLanguage, normalizeLocale } from "./locales";

/** The language every backend name has (the platform's fallback language). */
const FALLBACK_LANGUAGE = "en";

/**
 * A name from the backend's `{ en, ar, … }` map (`displayNames`) for the page's
 * language: the exact language, then its base language, then English, then the
 * `fallback` the answer carried (`displayName`, e.g. from an older backend). Empty string when none.
 */
export function nameInLanguage(
  names: Readonly<Record<string, string>> | null | undefined,
  language: string | null | undefined,
  fallback?: string | null,
): string {
  const entries = Object.entries(names ?? {}).filter(
    ([, value]) => typeof value === "string" && value.trim(),
  );
  const want = normalizeLocale(language);
  const exact = entries.find(([key]) => normalizeLocale(key) === want);
  if (exact) return exact[1].trim();
  const base = want ? baseLanguage(want) : "";
  const sameBase = base ? entries.find(([key]) => baseLanguage(key) === base) : undefined;
  if (sameBase) return sameBase[1].trim();
  const english = entries.find(([key]) => baseLanguage(key) === FALLBACK_LANGUAGE);
  if (english) return english[1].trim();
  return fallback?.trim() ?? "";
}
