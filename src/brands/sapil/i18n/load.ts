import type { MessageValue } from "@/lib/i18n/messages";
import type { ShopLocale } from "@/lib/i18n/locales";
import { AREAS, ENGLISH } from "./catalog";

export type SapilDictionary = Record<string, MessageValue>;

const SAFE_CODE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

function flatten(area: string, entries: Record<string, unknown>, into: SapilDictionary) {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === "string" || (value && typeof value === "object")) {
      into[`${area}.${key}`] = value as MessageValue;
    }
  }
}

const loaded = new Map<string, Promise<SapilDictionary>>();

/** Sapil's wording for a language, over the English files (server; cached per language). */
export function loadSapilMessages(locale: ShopLocale): Promise<SapilDictionary> {
  let pending = loaded.get(locale);
  if (!pending) {
    pending = (async () => {
      const dict: SapilDictionary = {};
      for (const area of AREAS) flatten(area, ENGLISH[area] as Record<string, unknown>, dict);
      if (locale !== "en" && SAFE_CODE.test(locale)) {
        await Promise.all(
          AREAS.map(async (area) => {
            try {
              const mod = (await import(`./messages/${locale}/${area}.json`)) as {
                default?: Record<string, unknown>;
              };
              flatten(area, (mod.default ?? mod) as Record<string, unknown>, dict);
            } catch {
              // No file for this area in this language: English stays.
            }
          }),
        );
      }
      return dict;
    })();
    loaded.set(locale, pending);
  }
  return pending;
}
