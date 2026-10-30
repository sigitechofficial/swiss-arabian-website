import { loadStripe, type Stripe } from "@stripe/stripe-js";

const CACHE_KEY = "__saStripeByPublishableKey";

type StripeCache = Map<string, Promise<Stripe | null>>;

function cache(): StripeCache {
  const host = globalThis as typeof globalThis & { [CACHE_KEY]?: StripeCache };
  host[CACHE_KEY] ??= new Map();
  return host[CACHE_KEY];
}

/**
 * One Stripe.js instance per publishable key for the life of the page.
 * The cache sits on globalThis so a dev reload of this module does not call
 * the Stripe constructor again.
 */
export function getStripe(publishableKey: string): Promise<Stripe | null> {
  const key = publishableKey.trim();
  const existing = cache().get(key);
  if (existing) return existing;
  const created = loadStripe(key);
  cache().set(key, created);
  return created;
}
