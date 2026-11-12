import en from "@/messages/en.json";
import { DEFAULT_LOCALE, intlLocale, isLocale, type ShopLocale } from "./locales";

/**
 * UI wording: one JSON file per locale in `src/messages/{locale}.json`.
 *
 * - English (`en.json`) is the reference: it defines every key, and any key a
 *   translation leaves out falls back to English.
 * - `{name}` placeholders are filled from `values`.
 * - Plurals are objects keyed by `Intl.PluralRules` category
 *   (`zero`/`one`/`two`/`few`/`many`/`other`) with a `{count}` placeholder.
 */
export type Messages = typeof en;
export type MessageKey = keyof Messages;
export type MessageValues = Record<string, string | number>;
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type MessageValue = string | PluralForms;
export type MessageDictionary = Partial<Record<MessageKey, MessageValue>> & Record<string, MessageValue>;
export type Translator = (key: MessageKey, values?: MessageValues) => string;

const ENGLISH = en as unknown as Record<string, MessageValue>;

const SAFE_CODE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

const loaded = new Map<string, Promise<MessageDictionary>>();

async function importMessages(locale: string): Promise<MessageDictionary> {
  if (locale === "en") return ENGLISH as MessageDictionary;
  if (!SAFE_CODE.test(locale)) return {};
  try {
    // Every `src/messages/*.json` file is bundled: a new language only needs its file.
    const mod = (await import(`../../messages/${locale}.json`)) as {
      default?: MessageDictionary;
    };
    return (mod.default ?? (mod as unknown as MessageDictionary)) || {};
  } catch {
    return {};
  }
}

/** The locale's messages over the English ones (missing keys read English). */
export function loadMessages(locale: ShopLocale): Promise<MessageDictionary> {
  const code = isLocale(locale) ? locale : DEFAULT_LOCALE;
  let pending = loaded.get(code);
  if (!pending) {
    pending = importMessages(code).then((own) => ({ ...ENGLISH, ...own }) as MessageDictionary);
    loaded.set(code, pending);
  }
  return pending;
}

function fill(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

function pluralCategory(locale: string, count: number): Intl.LDMLPluralRule {
  try {
    return new Intl.PluralRules(intlLocale(locale)).select(count);
  } catch {
    return count === 1 ? "one" : "other";
  }
}

/** One message, interpolated (and pluralised by `values.count`). */
export function formatMessage(
  locale: ShopLocale,
  messages: Record<string, MessageValue | undefined>,
  key: string,
  values?: MessageValues,
): string {
  const entry = messages[key] ?? ENGLISH[key];
  if (entry === undefined) return key;
  if (typeof entry === "string") return fill(entry, values);
  const count = Number(values?.count ?? 0);
  // Exact zero gets its own form where a translation has one ("No products").
  const form =
    (count === 0 ? entry.zero : undefined) ??
    entry[pluralCategory(locale, count)] ??
    entry.other;
  return fill(form, values);
}

export function createTranslator(
  locale: ShopLocale,
  messages: Record<string, MessageValue | undefined>,
): Translator {
  return (key, values) => formatMessage(locale, messages, key, values);
}

/** Server: a translator for a locale (loads its message file once). */
export async function getTranslator(locale: ShopLocale): Promise<Translator> {
  return createTranslator(locale, await loadMessages(locale));
}

/** English wording, available synchronously (fallbacks outside a locale route). */
export const englishTranslator: Translator = createTranslator("en", ENGLISH);
