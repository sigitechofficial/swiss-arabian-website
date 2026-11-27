"use client";

import { useSyncExternalStore } from "react";
import { getEffectiveConsent, subscribeConsent, type ConsentCategory, type ConsentChoices } from "./consent";

/**
 * What may run: the shopper's cookie choices, or, where the market does not require consent and no
 * choice was made, both categories allowed (as Shopify). Updated as soon as they choose (in this tab
 * or another) or the market's rule is known.
 * The server render and the first client render see "not chosen", so markup always matches;
 * the stored choice is read right after.
 */
export function useConsent(): ConsentChoices | null {
  return useSyncExternalStore(subscribeConsent, getEffectiveConsent, () => null);
}

/** True once the shopper allowed this category. */
export function useConsentFor(category: ConsentCategory): boolean {
  return useConsent()?.[category] === true;
}
