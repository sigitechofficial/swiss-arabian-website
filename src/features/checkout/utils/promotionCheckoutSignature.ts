/** Bag plus coupon, merchandise discount, shipping discount, gift-card tender, and loyalty. */

export type CheckoutSignatureLine = {
  cartItemId?: string | null;
  quantity: number;
};

export function checkoutLineSignature(lines: CheckoutSignatureLine[]): string {
  return lines
    .filter((line) => line.cartItemId)
    .map((line) => `${line.cartItemId}:${line.quantity}`)
    .sort()
    .join("|");
}

export function promotionCheckoutSignature(input: {
  lines: CheckoutSignatureLine[];
  couponCode?: string;
  merchandiseDiscount?: number;
  shippingDiscount?: number;
  giftCards?: string;
  loyalty?: string;
}): string {
  return [
    checkoutLineSignature(input.lines),
    `c:${input.couponCode ?? ""}`,
    `d:${input.merchandiseDiscount ?? 0}`,
    `s:${input.shippingDiscount ?? 0}`,
    `g:${input.giftCards ?? ""}`,
    `l:${input.loyalty ?? ""}`,
  ].join("|");
}

/** True once a session exists and the bag or promotion quote has changed. */
export function checkoutSignatureChanged(previous: string | null, next: string): boolean {
  return previous !== null && previous !== next;
}
