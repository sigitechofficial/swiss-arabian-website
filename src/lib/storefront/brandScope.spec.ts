import { describe, expect, it } from "vitest";
import { storefrontContextQuery, toAuthSalesChannelCode } from "@/lib/storefront/context";
import { useUiStore } from "@/stores/useUiStore";
import { readPromotionSnapshot } from "@/features/promotions/types/promotions";
import { storefrontHostFromHeaderValues } from "@/lib/api/storefrontHost";

describe("brand scoped storefront context", () => {
  it("sends the markets sales channel, not the old invented platform_uae code", () => {
    useUiStore.setState({ catalogContext: null, selectedMarketId: null });
    expect(toAuthSalesChannelCode("UAE")).toBe("platform_sa_uae");
    expect(toAuthSalesChannelCode("KSA")).toBe("platform_sa_ksa");
    const query = storefrontContextQuery({ zoneCode: "UAE" });
    expect(query).toContain("salesChannelCode=platform_sa_uae");
    expect(query).not.toContain("salesChannelCode=platform_uae");
  });

  it("replaces a saved platform_uae channel with the markets channel", () => {
    useUiStore.setState({
      catalogContext: {
        zoneCode: "UAE",
        salesChannelCode: "platform_uae",
        currencyCode: "AED",
      },
    });
    expect(storefrontContextQuery({ zoneCode: "UAE" })).toContain(
      "salesChannelCode=platform_sa_uae",
    );
    useUiStore.setState({
      catalogContext: {
        zoneCode: "UAE",
        salesChannelCode: "platform_sa_uae",
        currencyCode: "AED",
      },
    });
    expect(storefrontContextQuery({ zoneCode: "KSA" })).toContain(
      "salesChannelCode=platform_sa_ksa",
    );
    useUiStore.setState({ catalogContext: null });
  });

  it("sends zone, currency, and channel and does not choose a brand", () => {
    const query = storefrontContextQuery({
      zoneCode: "UAE",
      currencyCode: "AED",
      salesChannelCode: "platform_uae",
      countryCode: "AE",
    });
    expect(query).toContain("zoneCode=UAE");
    expect(query).toContain("currencyCode=AED");
    expect(query).toContain("salesChannelCode=platform_uae");
    expect(query.toLowerCase()).not.toContain("brand");
    expect(query).not.toContain("SWISS_ARABIAN");
    expect(query).not.toContain("SAPIL");
  });

  it("keeps a valid Swiss promotion exactly as the server snapshot", () => {
    const snapshot = readPromotionSnapshot({
      v: 1,
      context: {
        brandCode: "SWISS_ARABIAN",
        zoneCode: "UAE",
        currencyCode: "AED",
        salesChannelCode: "platform_uae",
      },
      applied: [{ code: "EID_AUTO10", amount: "9.90", kind: "AUTOMATIC", label: "Eid", discountType: "PERCENTAGE" }],
      totals: { discountTotal: "9.90" },
      rejected: [],
    });
    expect(snapshot?.context.brandCode).toBe("SWISS_ARABIAN");
    expect(snapshot?.applied.map((row) => row.code)).toEqual(["EID_AUTO10"]);
  });

  it("does not add a Swiss promotion when the server quote is for another brand", () => {
    const snapshot = readPromotionSnapshot({
      v: 1,
      context: {
        brandCode: "SAPIL",
        zoneCode: "UAE",
        currencyCode: "AED",
        salesChannelCode: "platform_uae",
      },
      applied: [],
      totals: { discountTotal: "0" },
      rejected: [{ reason: "BRAND_MISMATCH", message: "This offer is not available." }],
    });
    expect(snapshot?.context.brandCode).toBe("SAPIL");
    expect(snapshot?.applied).toEqual([]);
    expect(snapshot?.totals.discountTotal).toBe("0");
  });

  it("does not treat a rejected coupon or gift card as an applied Swiss offer", () => {
    const snapshot = readPromotionSnapshot({
      v: 1,
      context: { brandCode: "SAPIL", zoneCode: "UAE", currencyCode: "AED", salesChannelCode: "platform_uae" },
      applied: [],
      giftCards: [],
      totals: { discountTotal: "0", shippingDiscount: "0", amountPayable: "99.00" },
      rejected: [{ reason: "BRAND_MISMATCH", code: "QA10" }],
    });
    expect(snapshot?.applied).toEqual([]);
    expect(snapshot?.giftCards ?? []).toEqual([]);
    expect(snapshot?.totals.discountTotal).toBe("0");
    expect(snapshot?.totals.shippingDiscount).toBe("0");
    expect(snapshot?.totals.amountPayable).toBe("99.00");
  });

  it("keeps the SSR host as the brand signal and does not fall back to Swiss Arabian", () => {
    expect(storefrontHostFromHeaderValues("sapil.test, edge.internal", "swissarabian.com")).toBe("sapil.test");
    expect(storefrontHostFromHeaderValues(null, null)).toBeNull();
  });
});
