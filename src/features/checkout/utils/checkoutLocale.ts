import {
  isLocaleSwitchablePath,
  localeFromPathname,
  localizeHref,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { activeLocaleConfig } from "@/lib/i18n/activeLocaleConfig";
import { fallbackLocaleConfig, isLocale, type LocaleConfig, type ShopLocale } from "@/lib/i18n/locales";

/** The page's market languages (browser code only: the page's provider sets them). */
function languages(): LocaleConfig {
  return activeLocaleConfig() ?? fallbackLocaleConfig();
}

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
    sessionStorage.setItem(CHECKOUT_LOCALE_KEY, localeFromPathname(pathname, languages()));
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
  const config = languages();
  if (isLocaleSwitchablePath(current)) return localizeHref(href, current, config);
  const stored = storedCheckoutLocale();
  return stored ? localizeHref(href, withLocalePrefix("/", stored, config), config) : href;
}

/**
 * The language checkout runs in right now: the page's own language on a
 * checkout address, or the one checkout started in when this is a provider's
 * fixed return address.
 */
export function currentCheckoutLocale(): ShopLocale {
  const config = languages();
  if (typeof window === "undefined") return config.defaultLocale;
  const path = window.location.pathname || "/";
  if (isLocaleSwitchablePath(path)) return localeFromPathname(path, config);
  return storedCheckoutLocale() ?? config.defaultLocale;
}
