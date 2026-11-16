// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StorefrontMarket } from "@/features/markets/types/market";

const data = vi.hoisted(() => ({
  list: null as null | { siteMarketCode: string | null; defaultMarket: unknown; markets: unknown[] },
}));
vi.mock("@/features/markets/api/markets.service", () => ({
  fetchStorefrontMarkets: async () => data.list,
}));

import { resolveCatalogMarketFor } from "./serverMarket";
import { setSiteParamReader } from "@/lib/site/currentSite";

function market(zoneCode: string, countryCode: string): StorefrontMarket {
  return {
    zoneCode,
    zoneId: `z-${zoneCode}`,
    name: zoneCode,
    countryCode,
    defaultCurrencyCode: "AED",
    isCatalogReady: true,
    languages: [{ locale: "en", languageCode: "en", displayName: "en", isDefault: true }],
    catalogContext: { zoneCode, zoneId: `z-${zoneCode}`, countryCode, currencyCode: "AED" },
  } as unknown as StorefrontMarket;
}

const UAE = market("URD1", "AE");
const KSA = market("KSA", "SA");

afterEach(() => setSiteParamReader(async () => ""));

describe("resolveCatalogMarketFor: the page tree decides the market", () => {
  it("an address that serves several markets: the market of its page tree", async () => {
    data.list = { siteMarketCode: null, defaultMarket: UAE, markets: [UAE, KSA] };
    setSiteParamReader(async () => "swissarabian.com~KSA");
    expect((await resolveCatalogMarketFor("en")).zoneCode).toBe("KSA");
  });

  it("no market in the tree, or one the address does not have: the default market", async () => {
    data.list = { siteMarketCode: null, defaultMarket: UAE, markets: [UAE, KSA] };
    setSiteParamReader(async () => "swissarabian.com");
    expect((await resolveCatalogMarketFor("en")).zoneCode).toBe("URD1");
    setSiteParamReader(async () => "swissarabian.com~QTR");
    expect((await resolveCatalogMarketFor("en")).zoneCode).toBe("URD1");
  });

  it("a market address always serves its own market", async () => {
    data.list = { siteMarketCode: "URD1", defaultMarket: UAE, markets: [UAE, KSA] };
    setSiteParamReader(async () => "uae.swissarabian.com~KSA");
    expect((await resolveCatalogMarketFor("en")).zoneCode).toBe("URD1");
  });
});
