"use client";

import { useCartStore } from "@/stores/useCartStore";

/**
 * True while a payment for this bag took or holds money, or is under review:
 * the bag can't change until it settles, so each brand says so in plain words.
 *
 * A payment the shopper simply didn't finish is never shown: the bag is their
 * bag, and checking out or changing it releases that unpaid order on the
 * server (checkout QA-006, one rule for every payment method).
 */
export function useBagPaymentConfirming(): boolean {
  return useCartStore((s) => s.pendingPayment?.paymentConfirming === true);
}
