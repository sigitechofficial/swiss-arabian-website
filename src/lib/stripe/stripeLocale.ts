import type { StripeElementLocale } from "@stripe/stripe-js";
import { baseLanguage, normalizeLocale } from "@/lib/i18n/locales";

/**
 * Languages Stripe.js shows its forms in (Elements and the embedded Checkout
 * form), from docs.stripe.com/js/appendix/supported_locales, checked
 * 21 Nov 2026. "auto" (the browser's language) is left out on purpose: the
 * form follows the shop's language, not the browser's.
 */
export const STRIPE_ELEMENTS_LOCALES: readonly StripeElementLocale[] = [
  "en", "en-GB", "ar", "bg", "cs", "da", "de", "el", "es", "es-419", "et", "fi",
  "fil", "fr", "fr-CA", "he", "hr", "hu", "id", "it", "ja", "ko", "lt", "lv",
  "ms", "mt", "nb", "nl", "pl", "pt", "pt-BR", "ro", "ru", "sk", "sl", "sv",
  "th", "tr", "vi", "zh",
];

/**
 * The Stripe.js language for the shop language: the same code, else the same
 * base language ("ar-AE" → "ar"), else English.
 */
export function stripeElementsLocale(language: string | null | undefined): StripeElementLocale {
  const want = normalizeLocale(language);
  if (want) {
    const exact = STRIPE_ELEMENTS_LOCALES.find((code) => normalizeLocale(code) === want);
    if (exact) return exact;
    const base = baseLanguage(want);
    const sameBase = STRIPE_ELEMENTS_LOCALES.find((code) => normalizeLocale(code) === base);
    if (sameBase) return sameBase;
  }
  return "en";
}
