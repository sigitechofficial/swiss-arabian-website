import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { readLoyaltyRedemption } from "@/features/loyalty/types/loyalty";
import { promotionKeys } from "../api/promotions.keys";
import { couponErrorMessage } from "../utils/couponErrors";
import { offerQualificationMessage } from "../utils/qualificationCopy";
import { mapDiscoveryOffers } from "../utils/offerVoucher";
import { badgeForProduct, readPromotionDiscovery } from "./discovery";
import {
  amountPayableFrom,
  checkoutQuoteSnapshot,
  readApplicablePromotions,
  readPromotionSnapshot,
  visibleApplied,
  type PromotionSnapshotV1,
} from "./promotions";

function goldOffer(overrides: Record<string, unknown> = {}) {
  return {
    campaignCode: "GOLD10",
    publicTitle: "Gold member saving",
    badge: "Gold 10%",
    mechanic: "PERCENTAGE",
    shortMessage: "A Gold Rewards saving on this bag.",
    benefitSummary: "10% off",
    qualificationSummary: "Available on qualifying bags.",
    shopOfferAvailable: true,
    ...overrides,
  };
}

function goldQuote(applied: boolean): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: "2026-10-08T08:00:00.000Z",
    context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
    applied: applied
      ? [
          {
            kind: "AUTOMATIC",
            code: "GOLD10",
            label: "Gold member saving",
            discountType: "PERCENTAGE",
            discountValue: "10",
            level: "ORDER",
            amount: "25.00",
          },
        ]
      : [],
    lineAllocations: applied ? [{ ref: "line-1", sku: "SKU1", amount: "25.00" }] : [],
    totals: {
      discountTotal: applied ? "25.00" : "0",
      amountPayable: applied ? "225.00" : "250.00",
    },
    rejected: applied
      ? []
      : [{ code: "GOLD10", reason: "LOYALTY_TIER_REQUIRED", message: "This offer isn’t available right now." }],
  };
}

describe("FE-L6 server-driven loyalty promotion eligibility", () => {
  it("renders a Gold discovery result the Backend returned", () => {
    const discovery = readPromotionDiscovery({
      marketCode: "UAE",
      offers: [goldOffer()],
      productBadges: [
        { productId: "oud", campaignCode: "GOLD10", badge: "Gold 10%", publicTitle: "Gold member saving" },
      ],
    });
    expect(discovery.offers.map((row) => row.campaignCode)).toEqual(["GOLD10"]);
    expect(mapDiscoveryOffers(discovery.offers, false)[0]?.headline).toBe("Gold member saving");
    expect(badgeForProduct(discovery, "oud")?.badge).toBe("Gold 10%");
  });

  it("excludes a Gold campaign when Silver discovery does not return it", () => {
    const discovery = readPromotionDiscovery({
      marketCode: "UAE",
      offers: [{ campaignCode: "WELCOME5", publicTitle: "Welcome saving", badge: "5% off", mechanic: "PERCENTAGE" }],
    });
    expect(discovery.offers.map((row) => row.campaignCode)).not.toContain("GOLD10");
    expect(badgeForProduct(discovery, "oud")).toBeNull();
  });

  it("excludes a member campaign from guest discovery", () => {
    const discovery = readPromotionDiscovery({
      marketCode: "UAE",
      offers: [],
      tiles: [],
    });
    expect(discovery.offers).toEqual([]);
    expect(mapDiscoveryOffers(discovery.offers, false)).toEqual([]);
  });

  it("renders a member campaign when Backend returns it", () => {
    const discovery = readPromotionDiscovery({
      offers: [
        {
          campaignCode: "MEMBER5",
          publicTitle: "Member saving",
          badge: "Member 5%",
          mechanic: "PERCENTAGE",
        },
      ],
    });
    expect(discovery.offers[0]?.campaignCode).toBe("MEMBER5");
    expect(mapDiscoveryOffers(discovery.offers, false)[0]?.id).toBe("MEMBER5");
  });

  it("does not compare customer tier or requiredTier on the client", () => {
    const discovery = readPromotionDiscovery({
      requiredTier: "GOLD",
      customerTier: "SILVER",
      offers: [
        goldOffer({
          requiredTier: "GOLD",
          loyaltyMember: true,
          customerEligible: false,
        }),
      ],
    });
    expect(discovery.offers).toHaveLength(1);
    expect(discovery.offers[0]).not.toHaveProperty("requiredTier");
    expect(discovery.offers[0]).not.toHaveProperty("customerEligible");
    expect(JSON.stringify(discovery)).not.toMatch(/customerTier|requiredTier|loyaltyMember/);
  });

  it("applies a Gold cart quote only when Backend applied it", () => {
    const gold = readPromotionSnapshot(goldQuote(true));
    expect(visibleApplied(gold).map((row) => row.code)).toEqual(["GOLD10"]);
    expect(amountPayableFrom(gold)).toBe(225);

    const silver = readPromotionSnapshot(goldQuote(false));
    expect(visibleApplied(silver)).toEqual([]);
    expect(amountPayableFrom(silver)).toBe(250);
  });

  it("accepts a Gold-only coupon from the cart quote and maps Backend rejections", () => {
    const gold = readPromotionSnapshot({
      ...goldQuote(true),
      applied: [
        {
          kind: "COUPON",
          code: "GOLDONLY",
          label: "Gold coupon",
          discountType: "PERCENTAGE",
          discountValue: "10",
          level: "ORDER",
          amount: "25.00",
        },
      ],
    });
    expect(visibleApplied(gold)[0]?.code).toBe("GOLDONLY");

    const silver = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE",
      context: { reason: "LOYALTY_TIER_REQUIRED" },
    });
    expect(couponErrorMessage(silver)).toBe("This code isn’t available with your current Rewards status.");
    expect(couponErrorMessage(silver)).not.toMatch(/Gold|Silver|required tier/i);

    const guest = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE",
      context: { reason: "LOYALTY_MEMBER_REQUIRED" },
    });
    expect(couponErrorMessage(guest)).toBe("This code is for Rewards members.");
  });

  it("keys discovery and applicable quotes by market and customer so stale Gold results cannot leak", () => {
    expect(promotionKeys.discovery("UAE", "cust-gold", "")).not.toEqual(
      promotionKeys.discovery("KSA", "cust-gold", ""),
    );
    expect(promotionKeys.discovery("UAE", "cust-gold", "")).not.toEqual(
      promotionKeys.discovery("UAE", "guest", ""),
    );
    expect(promotionKeys.discovery("UAE", "guest", "")).not.toEqual(
      promotionKeys.discovery("UAE", "cust-member", ""),
    );
    expect(promotionKeys.applicable("cart-1", "t1", "UAE", "cust-gold")).not.toEqual(
      promotionKeys.applicable("cart-1", "t1", "KSA", "cust-gold"),
    );
    expect(promotionKeys.applicable("cart-1", "t1", "UAE", null)).toEqual(
      promotionKeys.applicable("cart-1", "t1", "UAE", undefined),
    );
  });

  it("excludes a Loyalty campaign when Program or Market disabled discovery omits it", () => {
    const disabled = readPromotionDiscovery({
      marketCode: "UAE",
      offers: [{ campaignCode: "EID10", publicTitle: "Eid weekend", badge: "Eid", mechanic: "PERCENTAGE" }],
    });
    expect(disabled.offers.map((row) => row.campaignCode)).toEqual(["EID10"]);
    expect(disabled.offers.map((row) => row.campaignCode)).not.toContain("GOLD10");
    expect(disabled.offers.map((row) => row.campaignCode)).not.toContain("MEMBER5");
  });

  it("does not keep a Gold offer because historical Rewards tier is Gold", () => {
    const discovery = readPromotionDiscovery({
      offers: [],
      historicalTier: { code: "GOLD", name: "Gold" },
    });
    expect(discovery.offers).toEqual([]);
    expect(discovery).not.toHaveProperty("historicalTier");
  });

  it("keeps a Gold promotion when Backend still applies it and redemption is blocked", () => {
    const promotions = readApplicablePromotions({
      promotions: goldQuote(true),
      offers: [{ campaignCode: "GOLD10", title: "Gold member saving", applied: true }],
    });
    expect(visibleApplied(promotions.promotions)[0]?.code).toBe("GOLD10");

    const allowed = readLoyaltyRedemption({
      enabled: true,
      eligible: true,
      availablePoints: 500,
      appliedPoints: 0,
      appliedAmount: "0.00",
      currencyCode: "AED",
    });
    expect(allowed?.eligible).toBe(true);

    const blocked = readLoyaltyRedemption({
      enabled: true,
      eligible: false,
      availablePoints: 500,
      appliedPoints: 0,
      appliedAmount: "0.00",
      currencyCode: "AED",
      reason: "REDEMPTION_NOT_AVAILABLE_WITH_CURRENT_OFFERS",
    });
    expect(blocked?.reasonMessage).toBe("Reward points can’t be used with the current offer.");
    expect(visibleApplied(promotions.promotions)).toHaveLength(1);
  });

  it("uses the next Backend cart after a tier upgrade and does not locally add Gold to the paid order", () => {
    const paidOrderQuote = readPromotionSnapshot(goldQuote(false));
    expect(visibleApplied(paidOrderQuote)).toEqual([]);
    expect(amountPayableFrom(paidOrderQuote)).toBe(250);

    const nextCart = readPromotionSnapshot(goldQuote(true));
    expect(visibleApplied(nextCart)[0]?.code).toBe("GOLD10");
    expect(amountPayableFrom(nextCart)).toBe(225);
  });

  it("drops a locally retained campaign when checkout requote omits it", () => {
    const cart = goldQuote(true);
    const session = goldQuote(false);
    const quoted = checkoutQuoteSnapshot({ promotions: session }, cart);
    expect(visibleApplied(quoted)).toEqual([]);
    expect(amountPayableFrom(quoted)).toBe(250);
  });

  it("does not invent Promotion money from remaining spend or tier rank", () => {
    const parsed = readApplicablePromotions({
      promotions: goldQuote(true),
      offers: [
        {
          campaignCode: "GOLD10",
          title: "Gold member saving",
          rejected: { reason: "LOYALTY_TIER_REQUIRED" },
          eligibility: { remainingAmount: "999.00", reason: "LOYALTY_TIER_REQUIRED" },
        },
      ],
    });
    expect(amountPayableFrom(parsed.promotions)).toBe(225);
    expect(Number(parsed.promotions.totals.discountTotal)).toBe(25);
    expect(amountPayableFrom(parsed.promotions)).not.toBe(999);
    expect(offerQualificationMessage(parsed.offers[0]!)).toBe(
      "This offer isn’t available with your current Rewards status.",
    );
  });
});
