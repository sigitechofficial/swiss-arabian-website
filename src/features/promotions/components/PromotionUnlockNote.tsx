"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import { shippingDiscountAmount } from "../types/promotions";

export function PromotionUnlockNote({ className = "cart-ship-banner" }: { className?: string }) {
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const currency = promotions?.context.currencyCode ?? totals?.currency ?? "AED";
  const { data } = useApplicablePromotions();
  const snapshot = data?.promotions ?? promotions;
  const shipOff = shippingDiscountAmount(snapshot);

  const nearMiss = (data?.offers ?? []).find((offer) => {
    if (offer.selected) return false;
    const rejected = offer.rejected;
    if (!rejected || rejected.reason !== "MIN_ORDER") return false;
    return Boolean(rejected.minOrderAmount);
  });

  const conflicts = (snapshot?.rejected ?? []).filter(
    (item) => item.reason === "PROMOTION_CONFLICT",
  );

  if (shipOff <= 0 && !nearMiss && !conflicts.length) return null;

  const title =
    nearMiss?.title?.trim() ||
    nearMiss?.label?.trim() ||
    "this offer";

  return (
    <div className={className} aria-live="polite">
      {shipOff > 0 ? <p>Free shipping applied.</p> : null}
      {shipOff <= 0 && nearMiss?.rejected?.minOrderAmount ? (
        <p>
          Spend {formatMoney(Number(nearMiss.rejected.minOrderAmount), currency)} to unlock{" "}
          {title}.
        </p>
      ) : null}
      {conflicts.map((item, index) => (
        <p className="promo-conflict" key={`${item.code ?? "conflict"}-${index}`}>
          {item.message?.trim() ||
            "Another offer didn’t combine with the one already on your bag."}
        </p>
      ))}
    </div>
  );
}
