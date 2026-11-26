import type { StorefrontMarket } from "../types/market";
import { parseMarketLink } from "@/lib/site/marketLink";

type Address = {
  /** The address's own market (a market website); null on the shared address. */
  siteMarketCode?: string | null;
  /** The brand's live shared address, where markets without a website are served. */
  sharedSiteUrl?: string | null;
};

type MarketFacts = Pick<StorefrontMarket, "zoneCode" | "storefrontUrl" | "onSharedAddress">;

/**
 * The markets the picker offers on this address (same rule as the proxy,
 * src/lib/site/siteRegistry.ts). On a market website: its own market, the markets
 * with a website of their own, and those the brand's shared address serves
 * (choosing one goes there). On the shared address of a brand with market websites:
 * the markets it serves and those with a website of their own; a market whose own
 * address is not live yet is on neither. With no market website, all of them.
 */
export function marketsOnAddress<M extends MarketFacts>(markets: M[], address: Address): M[] {
  const siteMarket = address.siteMarketCode;
  if (!siteMarket) {
    if (!markets.some((market) => market.storefrontUrl)) return markets;
    const routed = markets.filter((market) => market.storefrontUrl || market.onSharedAddress);
    return routed.length ? routed : markets;
  }
  const offered = markets.filter(
    (market) =>
      market.zoneCode === siteMarket ||
      market.storefrontUrl ||
      (market.onSharedAddress && address.sharedSiteUrl),
  );
  return offered.length ? offered : markets;
}

/**
 * On the shared address, a market choice (kept on the brand's domain by a market
 * link or the picker) of a market it serves: the market the proxy drew the page
 * for, over a market saved in this browser earlier. Null otherwise.
 */
export function choiceServedHere(
  markets: MarketFacts[],
  address: Address,
  choice: string | null,
): string | null {
  if (address.siteMarketCode || !choice) return null;
  return (
    markets.find(
      (market) => market.zoneCode === choice && market.onSharedAddress && !market.storefrontUrl,
    )?.zoneCode ?? null
  );
}

/**
 * The market of a page under `/~KWT` on the shared address (the address decides,
 * as the proxy does): one the shared address serves, also when that address is
 * another market's own website (swissarabian.com: Global's, NEW at /~NEW). Null
 * elsewhere.
 */
export function marketOfAddress(
  markets: MarketFacts[],
  address: Address,
  pathname: string,
): string | null {
  const code = parseMarketLink(pathname || "/")?.zoneCode;
  if (!code) return null;
  return (
    markets.find(
      (market) =>
        market.zoneCode === code &&
        market.zoneCode !== address.siteMarketCode &&
        market.onSharedAddress &&
        !market.storefrontUrl,
    )?.zoneCode ?? null
  );
}
