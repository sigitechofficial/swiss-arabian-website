"use client";

import { TabbyPromoSnippet } from "@/features/payments/tabby/TabbyPromoSnippet";

/**
 * Tabby on the cart page and mini cart: Tabby's official snippet for the bag
 * total (Tabby QA, Nov 2026), never our own plan text. Shown only when this
 * market's checkout offers Tabby (ADR-005 phase E).
 */
export function CartTabbyPromo({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return <TabbyPromoSnippet amount={amount} currency={currency} source="cart" className={className} />;
}
