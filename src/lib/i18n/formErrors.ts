import en from "@/messages/en.json";
import type { MessageKey, Translator } from "./messages";

/**
 * Some shared code keeps English wording on purpose: zod schemas (shared by
 * every brand and tested in English) and API readers that build view models
 * (loyalty activity labels…). Each such sentence has a key under a prefix in
 * `src/messages/en.json` with the same English text, so a view can show it in
 * the page's language. Text without a key (API data) passes through as is.
 */
const indexes = new Map<string, Map<string, MessageKey>>();

function indexFor(prefix: string): Map<string, MessageKey> {
  let index = indexes.get(prefix);
  if (!index) {
    index = new Map(
      Object.entries(en)
        .filter(([key, value]) => key.startsWith(prefix) && typeof value === "string")
        .map(([key, value]) => [value as string, key as MessageKey]),
    );
    indexes.set(prefix, index);
  }
  return index;
}

/** `text` in the translator's language when a `<prefix>*` key has it as its English wording. */
export function knownText(t: Translator, prefix: string, text: string): string;
export function knownText(t: Translator, prefix: string, text: string | null | undefined): string | null | undefined;
export function knownText(t: Translator, prefix: string, text: string | null | undefined) {
  if (!text) return text;
  const key = indexFor(prefix).get(text);
  return key ? t(key) : text;
}

/** A form (zod) error message in the page's language (`formError.*` keys). */
export function formErrorText(t: Translator, message: string | undefined): string | undefined {
  return knownText(t, "formError.", message) ?? undefined;
}
