import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { stripeElementsLocale } from "./stripeLocale";

const CACHE_KEY = "__saStripeByPublishableKey";

type StripeCache = Map<string, Promise<Stripe | null>>;

function cache(): StripeCache {
  const host = globalThis as typeof globalThis & { [CACHE_KEY]?: StripeCache };
  host[CACHE_KEY] ??= new Map();
  return host[CACHE_KEY];
}

/** The shop page's language (`<html lang>`, set by the locale layout). */
function pageLanguage(): string | null {
  return typeof document === "undefined" ? null : document.documentElement.lang || null;
}

/**
 * One Stripe.js instance per publishable key and language for the life of the
 * page. Stripe's form, its messages and its errors are in the shop's language
 * when Stripe has it, else English (never the browser's language).
 * The cache sits on globalThis so a dev reload of this module does not call
 * the Stripe constructor again.
 */
export function getStripe(
  publishableKey: string,
  language: string | null = pageLanguage(),
): Promise<Stripe | null> {
  const key = publishableKey.trim();
  const locale = stripeElementsLocale(language);
  const cacheKey = `${key}|${locale}`;
  const existing = cache().get(cacheKey);
  if (existing) return existing;
  const created = loadStripe(key, { locale });
  cache().set(cacheKey, created);
  return created;
}
