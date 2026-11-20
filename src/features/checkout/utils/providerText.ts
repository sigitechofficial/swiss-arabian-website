/**
 * A payment provider's shopper text in each language it comes in, English
 * always present: `{ en: "…", ar: "…", fr: "…" }`. The backend sends these
 * (rejection and pre-check messages) with every language it has wording for.
 */
export type ProviderText = { en: string; [language: string]: string };

/**
 * A provider text from the backend: any language map with English. Other
 * languages are kept when they have text; a map without English is not used
 * (the caller shows its own default wording).
 */
export function readProviderText(value: unknown): ProviderText | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [language, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) out[language.toLowerCase()] = text.trim();
  }
  return out.en ? (out as ProviderText) : null;
}

/** The text in `language` (the provider's page language), else English. */
export function providerTextIn(text: ProviderText, language: string): string {
  const own = text[language];
  return typeof own === "string" && own.trim() ? own : text.en;
}
