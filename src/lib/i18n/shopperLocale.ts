import type { ShopLocale } from "./localePath";

/**
 * The language the shopper last browsed the shop in.
 *
 * Shop pages carry the language in the address (`/ar/...`), but checkout,
 * order confirmation and the payment return pages stay unprefixed, so they
 * can't tell an Arabic shopper from an English one by the URL. The proxy saves
 * the language of every shop page in this cookie, and those pages read it to
 * talk to payment providers in the shopper's language (Tabby QA, Nov 2026:
 * Arabic shoppers must get Tabby's Arabic page and messages).
 */
export const SHOPPER_LOCALE_COOKIE = "sa_lang";

/** One year: a language choice should outlive the session. */
export const SHOPPER_LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseShopperLocale(value: string | null | undefined): ShopLocale | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v.startsWith("ar")) return "ar";
  if (v.startsWith("en")) return "en";
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    for (const part of document.cookie.split(";")) {
      const [key, ...rest] = part.trim().split("=");
      if (key === name) return decodeURIComponent(rest.join("="));
    }
  } catch {
    // Cookies blocked: fall through to English.
  }
  return null;
}

/**
 * Client only. An Arabic page (`<html lang="ar">`) is always Arabic; an
 * unprefixed page uses the remembered shop language; otherwise English.
 */
export function currentShopperLocale(): ShopLocale {
  if (typeof document === "undefined") return "en";
  if (parseShopperLocale(document.documentElement.lang) === "ar") return "ar";
  return parseShopperLocale(readCookie(SHOPPER_LOCALE_COOKIE)) ?? "en";
}
