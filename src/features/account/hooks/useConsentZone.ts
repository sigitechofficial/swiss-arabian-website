"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOptionalMarket } from "@/providers/MarketProvider";

import type { StorefrontMarketingConsentView } from "../types/customerAccount";

/**
 * The market a marketing consent belongs to: the one the shopper is looking at ("Ship to"),
 * else the account's own market. Consent is kept per market, so saving it for the account market
 * while the page shows another one records the shopper's choice for the wrong market.
 */
export function useConsentZoneId(): string | null {
  const market = useOptionalMarket();
  const user = useCurrentUser();
  return market?.catalogContext?.zoneId || user?.zoneId || null;
}

/**
 * The saved consent row for one channel in that market. A row without a market applies to every
 * market, so it is the fallback; rows for other markets are never shown as this market's choice.
 */
export function consentRowFor(
  rows: StorefrontMarketingConsentView[] | undefined,
  channel: string,
  zoneId: string | null,
): StorefrontMarketingConsentView | undefined {
  const forChannel = (rows ?? []).filter((row) => row.channel === channel);
  return (
    (zoneId ? forChannel.find((row) => row.zoneId === zoneId) : undefined) ??
    forChannel.find((row) => !row.zoneId)
  );
}
