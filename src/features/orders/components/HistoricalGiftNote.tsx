"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { readGiftAwards } from "@/features/promotions/types/promotions";

/** Stored gift award. Does not recompute eligibility or price. */
export function HistoricalGiftNote({
  snapshot,
  className,
}: {
  snapshot: unknown;
  className: string;
}) {
  const t = useShopCopy();
  const hasGift = readGiftAwards(snapshot).some(
    (award) => award.giftItems.length > 0 || award.choices.length > 0,
  );
  if (!hasGift) return null;
  return <p className={className}>{t("orders.freeGiftIncluded")}</p>;
}
