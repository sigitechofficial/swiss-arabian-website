"use client";

import { TabbyPromoSnippet } from "@/features/payments/tabby/TabbyPromoSnippet";

/**
 * Tabby on the cart page and mini cart: Tabby's official snippet for the bag
 * total (Tabby QA, Nov 2026). Hidden where checkout doesn't offer Tabby.
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
