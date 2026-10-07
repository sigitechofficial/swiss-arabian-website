"use client";

import { LoyaltyRedemptionEditor } from "./LoyaltyRedemptionEditor";

/** Checkout shows the cart reservation. Change and remove still use cart endpoints. */
export function LoyaltyCheckoutReservation({ quoteOverride }: { quoteOverride?: unknown }) {
  return <LoyaltyRedemptionEditor quoteOverride={quoteOverride} />;
}
