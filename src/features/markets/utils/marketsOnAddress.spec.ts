import { describe, expect, it } from "vitest";
import { choiceServedHere, marketOfAddress, marketsOnAddress } from "./marketsOnAddress";

const URD1 = { zoneCode: "URD1", storefrontUrl: "https://uae.swissarabian.com", onSharedAddress: false };
const KWT = { zoneCode: "KWT", storefrontUrl: null, onSharedAddress: true };
const QAT = { zoneCode: "QAT", storefrontUrl: null, onSharedAddress: false };
const codes = (list: Array<{ zoneCode: string }>) => list.map((m) => m.zoneCode);

describe("markets the picker offers on an address", () => {
  it("a market website: its own, those with websites, and those the shared address serves", () => {
    const ksa = { zoneCode: "KSA", storefrontUrl: "https://ksa.swissarabian.com", onSharedAddress: false };
    const all = [URD1, ksa, KWT, QAT];
    expect(codes(marketsOnAddress(all, { siteMarketCode: "KSA", sharedSiteUrl: "https://swissarabian.com" }))).toEqual([
      "URD1",
      "KSA",
      "KWT",
    ]);
    // No shared address live: KWT cannot be reached from here.
    expect(codes(marketsOnAddress(all, { siteMarketCode: "KSA", sharedSiteUrl: null }))).toEqual(["URD1", "KSA"]);
  });

  it("the shared address: the markets it serves and the market websites, never a market not live yet", () => {
    expect(codes(marketsOnAddress([URD1, KWT, QAT], { siteMarketCode: null }))).toEqual(["URD1", "KWT"]);
  });

  it("one address for all markets (no market website yet): every market", () => {
    expect(codes(marketsOnAddress([{ ...KWT, onSharedAddress: undefined }, QAT], {}))).toEqual(["KWT", "QAT"]);
  });
});

describe("a market choice on the shared address", () => {
  it("counts only for a market the shared address serves, and only there", () => {
    expect(choiceServedHere([URD1, KWT, QAT], {}, "KWT")).toBe("KWT");
    expect(choiceServedHere([URD1, KWT, QAT], {}, "URD1")).toBeNull();
    expect(choiceServedHere([URD1, KWT, QAT], {}, "QAT")).toBeNull();
    expect(choiceServedHere([URD1, KWT], { siteMarketCode: "URD1" }, "KWT")).toBeNull();
    expect(choiceServedHere([URD1, KWT], {}, null)).toBeNull();
  });
});

describe("the market of a page under /~CODE on the shared address", () => {
  it("is that market when the shared address serves it, and only there", () => {
    expect(marketOfAddress([URD1, KWT, QAT], {}, "/~KWT/ar/products/oud")).toBe("KWT");
    expect(marketOfAddress([URD1, KWT, QAT], {}, "/~QAT/products")).toBeNull();
    expect(marketOfAddress([URD1, KWT], {}, "/ar/products/oud")).toBeNull();
    // On the main address that is a market's own website (only there does the proxy
    // serve /~KWT); never the address's own market.
    expect(marketOfAddress([URD1, KWT], { siteMarketCode: "GLOBAL" }, "/~KWT")).toBe("KWT");
    expect(
      marketOfAddress([{ ...KWT, zoneCode: "GLOBAL" }], { siteMarketCode: "GLOBAL" }, "/~GLOBAL"),
    ).toBeNull();
  });
});
