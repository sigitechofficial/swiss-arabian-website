import {
  isLocaleSwitchablePath,
  localeFromPathname,
  localizeHref,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { isLocale, type ShopLocale } from "@/lib/i18n/locales";

/**
 * The language checkout was started in, kept for the payment round-trip.
 * Tabby and Telr send the shopper back to fixed, unprefixed addresses
 * (`/payments/…/return`); from there the confirmation still opens in the
 * shopper's language.
 */
const CHECKOUT_LOCALE_KEY = "sa_checkout_locale";

export function rememberCheckoutLocale(pathname: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHECKOUT_LOCALE_KEY, localeFromPathname(pathname));
  } catch {
    // Storage blocked: the return lands in the default language.
  }
}

export function storedCheckoutLocale(): ShopLocale | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(CHECKOUT_LOCALE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * A checkout address (`/order-confirmation/…`, `/checkout/payment/…`) in the
 * shopper's language: the language of the page they are on, or, on a provider's
 * fixed return address, the one checkout started in. Absolute URLs are unchanged.
 */
export function checkoutHref(href: string, here?: string): string {
  const current = here ?? (typeof window === "undefined" ? "/" : window.location.pathname);
  if (isLocaleSwitchablePath(current)) return localizeHref(href, current);
  const stored = storedCheckoutLocale();
  return stored ? localizeHref(href, withLocalePrefix("/", stored)) : href;
}
