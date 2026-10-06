import { ApiClientError } from "@/lib/api/apiError";

const CODE_COPY: Record<string, string> = {
  GIFT_CARD_NOT_FOUND: "That gift card isn’t valid.",
  GIFT_CARD_INACTIVE: "That gift card isn’t available right now.",
  GIFT_CARD_EXPIRED: "That gift card has expired.",
  GIFT_CARD_ALREADY_APPLIED: "This gift card is already on your order.",
  GIFT_CARD_INSUFFICIENT_BALANCE: "This gift card doesn’t have enough balance.",
  GIFT_CARD_NOT_APPLICABLE: "This gift card doesn’t apply to your bag.",
  GIFT_CARD_REQUIRES_LOGIN: "Sign in to use this gift card.",
  GIFT_CARD_USAGE_LIMIT_REACHED: "This gift card has reached its usage limit.",
  PRICING_CHANGED: "Prices have changed. We’ve refreshed your bag — check the total before placing the order.",
  REDEMPTION_EXPIRED: "That offer expired. Apply the card again.",
};

export function giftCardErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code && CODE_COPY[error.code]) return CODE_COPY[error.code];
    return error.message || "We couldn’t apply that gift card. Please try again.";
  }
  return "We couldn’t apply that gift card. Please try again.";
}
