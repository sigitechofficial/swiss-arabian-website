"use client";

import Link from "next/link";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useUiStore } from "@/stores/useUiStore";
import { useLoyaltyRedemption } from "../hooks/useLoyaltyRedemption";
import { formatPoints } from "../types/loyalty";

/** Compact bag-drawer state. The editor lives on the bag page. */
export function LoyaltyDrawerNote() {
  const { quote, hidden } = useLoyaltyRedemption();
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  if (hidden || !quote) return null;

  const currency = quote.currencyCode ?? "AED";
  const applied = quote.appliedPoints > 0;
  const canUse = quote.enabled && quote.eligible;

  if (!applied && !canUse) return null;

  return (
    <p className="loyalty-earn-note" data-testid="loyalty-drawer">
      {applied ? (
        <>
          {`Using ${formatPoints(quote.appliedPoints)} points`}
          {quote.appliedAmount > 0 ? ` (−${formatMoney(quote.appliedAmount, currency)})` : ""}
          {" · "}
          <Link href="/cart" onClick={() => setCartOpen(false)}>
            Change in bag
          </Link>
        </>
      ) : (
        <Link href="/cart" onClick={() => setCartOpen(false)}>
          Use points
        </Link>
      )}
    </p>
  );
}
