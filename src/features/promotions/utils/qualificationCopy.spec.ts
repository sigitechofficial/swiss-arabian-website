import { describe, expect, it } from "vitest";
import { shippingDiscountAmount, visibleApplied, type PromotionSnapshotV1 } from "../types/promotions";
import { offerQualificationMessage } from "./qualificationCopy";

const currency = "AED";

describe("qualification copy", () => {
  it("renders remainingAmount directly for a minimum order", () => {
    expect(
      offerQualificationMessage(
        {
          qualification: { status: "INELIGIBLE", remainingAmount: "75.00", minOrderAmount: "300.00" },
          rejected: { reason: "MIN_ORDER", minOrderAmount: "300.00" },
        },
        currency,
      ),
    ).toBe("Spend AED 75.00 to unlock free shipping.");
  });

  it("uses the offer title with a structured minimum when remaining is absent", () => {
    expect(
      offerQualificationMessage(
        {
          title: "Eid weekend",
          qualification: { status: "INELIGIBLE", minOrderAmount: "300.00" },
          rejected: { reason: "MIN_ORDER" },
        },
        currency,
      ),
    ).toBe("Spend AED 300.00 to unlock Eid weekend.");
  });

  it("uses safe copy for an eligible-subtotal miss and can show a server remaining amount", () => {
    expect(
      offerQualificationMessage(
        { rejected: { reason: "MIN_ELIGIBLE_SUBTOTAL", message: "MIN_ELIGIBLE_SUBTOTAL" } },
        currency,
      ),
    ).toBe("Add more eligible items to unlock this offer.");
    expect(
      offerQualificationMessage(
        {
          rejected: {
            reason: "MIN_ELIGIBLE_SUBTOTAL",
            message: "Add another Shaghaf bottle to qualify.",
            remainingAmount: "50.00",
          },
        },
        currency,
      ),
    ).toBe("Add another Shaghaf bottle to qualify.");
    expect(
      offerQualificationMessage(
        {
          qualification: { remainingAmount: "50.00" },
          rejected: { reason: "MIN_ELIGIBLE_SUBTOTAL" },
        },
        currency,
      ),
    ).toBe("Spend AED 50.00 to unlock this offer.");
  });

  it("uses safe copy for quantity and required-product misses", () => {
    expect(offerQualificationMessage({ rejected: { reason: "MIN_ORDER_QUANTITY" } })).toBe(
      "Add more items to unlock this offer.",
    );
    expect(offerQualificationMessage({ rejected: { reason: "MIN_ELIGIBLE_QUANTITY" } })).toBe(
      "Add more eligible items to unlock this offer.",
    );
    expect(offerQualificationMessage({ rejected: { reason: "REQUIRED_PRODUCT_MISSING" } })).toBe(
      "Add the required item to use this offer.",
    );
  });

  it("uses customer-safe copy for Loyalty eligibility misses", () => {
    expect(offerQualificationMessage({ rejected: { reason: "LOYALTY_TIER_REQUIRED" } })).toBe(
      "This offer isn’t available with your current Rewards status.",
    );
    expect(offerQualificationMessage({ rejected: { reason: "LOYALTY_TIER_MISMATCH" } })).toBe(
      "This offer isn’t available with your current Rewards status.",
    );
    expect(
      offerQualificationMessage({
        rejected: { reason: "LOYALTY_MEMBER_REQUIRED", message: "Join Rewards to use this offer." },
      }),
    ).toBe("Join Rewards to use this offer.");
    expect(offerQualificationMessage({ rejected: { reason: "LOYALTY_TIER_REQUIRED" } })).not.toMatch(
      /Gold|Silver|requiredTier/,
    );
  });

  it("renders pending method offers as information, not as applied", () => {
    expect(
      offerQualificationMessage({
        selected: true,
        qualification: { status: "PENDING", pendingReason: "PAYMENT_METHOD_REQUIRED" },
      }),
    ).toBe("Select an eligible payment method at checkout to use this offer.");
    expect(
      offerQualificationMessage({
        qualification: { status: "PENDING", pendingReason: "SHIPPING_METHOD_REQUIRED" },
      }),
    ).toBe("Select an eligible delivery method at checkout to use this offer.");
  });

  it("does not treat a pending free-shipping offer as unlocked", () => {
    const snapshot: PromotionSnapshotV1 = {
      v: 1,
      computedAt: null,
      context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
      applied: [],
      lineAllocations: [],
      totals: { discountTotal: "0", shippingDiscount: "0" },
      rejected: [],
    };
    expect(shippingDiscountAmount(snapshot)).toBe(0);
    expect(visibleApplied(snapshot)).toEqual([]);
    const message = offerQualificationMessage({
      title: "Free shipping",
      qualification: { status: "PENDING", pendingReason: "SHIPPING_METHOD_REQUIRED" },
    });
    expect(message).not.toMatch(/unlocked/i);
    expect(message).not.toMatch(/applied/i);
  });
});
