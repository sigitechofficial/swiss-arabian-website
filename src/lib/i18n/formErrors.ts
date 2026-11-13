import en from "@/messages/en.json";
import type { MessageKey, Translator } from "./messages";

/**
 * Form (zod) schemas keep their English messages: they are shared by every
 * brand and tested in English. Each one has a `formError.*` key in
 * `src/messages/en.json` with the same English text, so a view can show it in
 * the page's language. Messages without a key (API errors) pass through.
 */
const KEY_BY_ENGLISH = new Map<string, MessageKey>(
  Object.entries(en)
    .filter(([key, value]) => key.startsWith("formError.") && typeof value === "string")
    .map(([key, value]) => [value as string, key as MessageKey]),
);

export function formErrorText(t: Translator, message: string | undefined): string | undefined {
  if (!message) return message;
  const key = KEY_BY_ENGLISH.get(message);
  return key ? t(key) : message;
}
