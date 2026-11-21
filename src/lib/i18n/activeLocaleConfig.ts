import type { LocaleConfig } from "./locales";

/**
 * The page's market languages in the browser, for code that runs outside React
 * render (event handlers, `window.location` readers). Set by `ShopLocaleProvider`
 * in the browser only: a browser tab shows one market website, so one value is
 * right there. On the server (many sites and markets at once) it is always null —
 * server code and render paths pass the config explicitly (`useLocaleConfig()`).
 */
let active: LocaleConfig | null = null;

export function setActiveLocaleConfig(config: LocaleConfig): void {
  if (typeof window === "undefined") return;
  active = config;
}

export function activeLocaleConfig(): LocaleConfig | null {
  if (typeof window === "undefined") return null;
  return active;
}
