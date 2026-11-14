import { brandIntegrations } from "@/lib/brand";
import { env } from "@/lib/config/env";

/**
 * The shopper's cookie choices, kept in this browser.
 *
 * Categories (the usual split on shop websites):
 *  - necessary: cart, sign-in, language, market. Always on, never asked.
 *  - analytics: our own first-party tracker, Google Analytics / Tag Manager.
 *  - marketing: Insider, and personalised on-site messages (popups and banners).
 *
 * Nothing optional runs, and no optional identifier is stored, until the shopper chooses.
 * The choice is stored as JSON under `sa_cookie_consent` with a version, so the banner can ask
 * again when the categories change. The older single answer (`sa_tracking_consent`, measurement
 * only) is not carried over: it never covered marketing, so those shoppers are asked once more.
 */
export type ConsentCategory = "analytics" | "marketing";

export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
}

interface StoredConsent extends ConsentChoices {
  version: number;
  decidedAt: string;
}

export const CONSENT_STORAGE_KEY = "sa_cookie_consent";
/** Bump when categories change; older answers are then asked again. */
export const CONSENT_VERSION = 1;
const LEGACY_KEY = "sa_tracking_consent";
const CHANGE_EVENT = "sa-consent-change";
const OPEN_EVENT = "sa-consent-open";

/** Browser data that belongs to an optional category, removed when that category is refused. */
const CATEGORY_STORAGE: Record<ConsentCategory, { local: string[]; session: string[] }> = {
  analytics: { local: ["sa_visitor_id"], session: ["sa_session"] },
  marketing: { local: ["sa_insider_uuid", "sa_insider_user"], session: [] },
};

let cachedRaw: string | null | undefined;
let cachedValue: ConsentChoices | null = null;

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The stored choices, or null when the shopper has not chosen (or chose under older categories). */
export function getConsent(): ConsentChoices | null {
  const raw = readRaw();
  // Same object while the stored value is unchanged, so React's external store stays stable.
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredConsent>;
      if (parsed && parsed.version === CONSENT_VERSION) {
        cachedValue = {
          analytics: parsed.analytics === true,
          marketing: parsed.marketing === true,
        };
      }
    } catch {
      // unreadable: ask again
    }
  }
  return cachedValue;
}

export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()?.[category] === true;
}

/** True once the shopper has answered the current banner. */
export function hasDecided(): boolean {
  return getConsent() !== null;
}

function removeStorage(category: ConsentCategory): void {
  const { local, session } = CATEGORY_STORAGE[category];
  try {
    for (const key of local) window.localStorage.removeItem(key);
    for (const key of session) window.sessionStorage.removeItem(key);
  } catch {
    // storage blocked: nothing stored either
  }
}

/**
 * Saves the choices and tells the page. Refused categories have their stored identifiers removed.
 * Returns true when a category that was on is now off: scripts already loaded for it (Insider,
 * Google tags) cannot be unloaded, so the caller reloads the page.
 */
export function setConsent(choices: ConsentChoices): boolean {
  if (typeof window === "undefined") return false;
  const before = getConsent();
  const stored: StoredConsent = {
    analytics: choices.analytics,
    marketing: choices.marketing,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // storage blocked: the choice holds for this page only
    cachedRaw = JSON.stringify(stored);
    cachedValue = { analytics: choices.analytics, marketing: choices.marketing };
  }
  if (!choices.analytics) removeStorage("analytics");
  if (!choices.marketing) removeStorage("marketing");
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { ...choices } }));
  return Boolean(
    (before?.analytics && !choices.analytics) || (before?.marketing && !choices.marketing),
  );
}

/** For useSyncExternalStore: fires on a choice in this tab or another tab. */
export function subscribeConsent(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The footer "Cookie settings" link: opens the choices again. */
export function openConsentSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function subscribeConsentOpen(onOpen: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(OPEN_EVENT, onOpen);
  return () => window.removeEventListener(OPEN_EVENT, onOpen);
}

/** Which optional categories this deployment actually uses; the banner only offers those. */
export function consentCategoriesInUse(): Record<ConsentCategory, boolean> {
  let analytics = false;
  let marketing = false;
  try {
    const integrations = brandIntegrations();
    analytics =
      env.tracking.enabled === true ||
      Boolean(integrations.analytics.gtmId || integrations.analytics.ga4Id);
    marketing =
      Boolean(integrations.insider.enabled && integrations.insider.accountId) ||
      env.onsite.enabled === true;
  } catch {
    // a broken config means nothing optional runs
  }
  return { analytics, marketing };
}

/** The banner is needed only when something optional is switched on for this site. */
export function consentBannerNeeded(): boolean {
  const used = consentCategoriesInUse();
  return used.analytics || used.marketing;
}

/** Test helper: forget the cached reading. */
export function resetConsentCacheForTests(): void {
  cachedRaw = undefined;
  cachedValue = null;
}
