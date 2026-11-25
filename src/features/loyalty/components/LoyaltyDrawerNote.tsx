"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import Link from "next/link";
import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useUiStore } from "@/stores/useUiStore";
import { useLoyaltyRedemption } from "../hooks/useLoyaltyRedemption";
import { formatPoints } from "../types/loyalty";

/** Compact bag-drawer state. The editor lives on the bag page. */
export function LoyaltyDrawerNote() {
  const t = useShopCopy();
  const marketCurrency = useMarketCurrency();
  const { quote, hidden } = useLoyaltyRedemption();
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  if (hidden || !quote) return null;

  const currency = quote.currencyCode ?? marketCurrency;
  const applied = quote.appliedPoints > 0;
  const canUse = quote.enabled && quote.eligible;

  if (!applied && !canUse) return null;

  return (
    <p className="loyalty-earn-note" data-testid="loyalty-drawer">
      {applied ? (
        <>
          {t("loyalty.drawer.using", { count: quote.appliedPoints, points: formatPoints(quote.appliedPoints) })}
          {quote.appliedAmount > 0
            ? ` (−${formatMoney(quote.appliedAmount, currency)})`
            : ""}
          {" · "}
          <Link href="/cart" onClick={() => setCartOpen(false)}>
            {t("loyalty.drawer.change")}
          </Link>
        </>
      ) : (
        <Link href="/cart" onClick={() => setCartOpen(false)}>
          {t("loyalty.drawer.use")}
        </Link>
      )}
    </p>
  );
}
