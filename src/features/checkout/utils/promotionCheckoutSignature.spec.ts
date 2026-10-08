import { describe, expect, it } from "vitest";
import {
  checkoutSignatureChanged,
  promotionCheckoutSignature,
} from "./promotionCheckoutSignature";

const lines = [{ cartItemId: "line-1", quantity: 2 }];

describe("promotion checkout signature", () => {
  it("changes when the coupon changes so checkout is rebuilt", () => {
    const before = promotionCheckoutSignature({
      lines,
      couponCode: "EID10",
      merchandiseDiscount: 10,
      shippingDiscount: 0,
      giftCards: "",
    });
    const after = promotionCheckoutSignature({
      lines,
      couponCode: "EID3FOR2",
      merchandiseDiscount: 50,
      shippingDiscount: 0,
      giftCards: "",
    });
    expect(after).not.toBe(before);
    expect(checkoutSignatureChanged(before, after)).toBe(true);
  });

  it("changes when the shipping discount changes so checkout is rebuilt", () => {
    const before = promotionCheckoutSignature({
      lines,
      couponCode: "SHIP",
      merchandiseDiscount: 0,
      shippingDiscount: 0,
      giftCards: "",
    });
    const after = promotionCheckoutSignature({
      lines,
      couponCode: "SHIP",
      merchandiseDiscount: 0,
      shippingDiscount: 25,
      giftCards: "",
    });
    expect(after).not.toBe(before);
    expect(checkoutSignatureChanged(before, after)).toBe(true);
    expect(checkoutSignatureChanged(null, after)).toBe(false);
  });

  it("changes when the gift card tender or the lines change", () => {
    const before = promotionCheckoutSignature({
      lines,
      couponCode: "",
      merchandiseDiscount: 0,
      shippingDiscount: 0,
      giftCards: "",
    });
    const withCard = promotionCheckoutSignature({
      lines,
      giftCards: "u1:50.00",
    });
    const withLine = promotionCheckoutSignature({
      lines: [{ cartItemId: "line-1", quantity: 3 }],
    });
    expect(checkoutSignatureChanged(before, withCard)).toBe(true);
    expect(checkoutSignatureChanged(before, withLine)).toBe(true);
  });

  it("changes when loyalty points change so checkout is rebuilt", () => {
    const before = promotionCheckoutSignature({
      lines,
      couponCode: "",
      merchandiseDiscount: 0,
      shippingDiscount: 0,
      giftCards: "",
      loyalty: "",
    });
    const after = promotionCheckoutSignature({
      lines,
      loyalty: "400:4",
    });
    expect(checkoutSignatureChanged(before, after)).toBe(true);
  });
});
