"use client";

import { useSyncExternalStore } from "react";
import { getConsent, subscribeConsent, type ConsentCategory, type ConsentChoices } from "./consent";

/**
 * The shopper's cookie choices, updated as soon as they choose (in this tab or another).
 * The server render and the first client render see "not chosen", so markup always matches;
 * the stored choice is read right after.
 */
export function useConsent(): ConsentChoices | null {
  return useSyncExternalStore(subscribeConsent, getConsent, () => null);
}

/** True once the shopper allowed this category. */
export function useConsentFor(category: ConsentCategory): boolean {
  return useConsent()?.[category] === true;
}
