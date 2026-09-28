"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useFreeShippingBar } from "../hooks/useFreeShippingBar";

export function PromotionUnlockNote({ className = "cart-ship-banner" }: { className?: string }) {
  const { isFree, progress, remaining, threshold, currency, snapshot, offers } = useFreeShippingBar();
  const [whoop, setWhoop] = useState(false);
  const wasFreeRef = useRef<boolean | null>(null);

  const couponNearMiss = offers.find((offer) => {
    if (offer.selected) return false;
    const rejected = offer.rejected;
    if (!rejected || rejected.reason !== "MIN_ORDER" || !rejected.minOrderAmount) return false;
    const hay = `${offer.code ?? ""} ${offer.campaignCode ?? ""} ${offer.title ?? ""} ${offer.label ?? ""}`.toLowerCase();
    return !/ship|deliver/.test(hay);
  });

  const conflicts = (snapshot?.rejected ?? []).filter(
    (item) => item.reason === "PROMOTION_CONFLICT",
  );

  const showBar = threshold != null || isFree;

  useEffect(() => {
    const previouslyFree = wasFreeRef.current;
    wasFreeRef.current = isFree;
    if (!isFree || previouslyFree !== false) return;
    setWhoop(true);
    const id = window.setTimeout(() => setWhoop(false), 1100);
    return () => window.clearTimeout(id);
  }, [isFree]);

  if (!showBar && !couponNearMiss && !conflicts.length) return null;

  const classes = [
    className,
    isFree ? "is-free" : "",
    whoop ? "is-whoop" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-live="polite">
      {showBar ? (
        <>
          <p>
            {isFree ? (
              <>
                <span className="ship-whoop-check" aria-hidden="true" />
                You&apos;ve unlocked free shipping
              </>
            ) : (
              <>Spend {formatMoney(remaining, currency)} to unlock free shipping</>
            )}
          </p>
          <div className="cart-ship-track">
            <div
              className="cart-ship-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </>
      ) : couponNearMiss?.rejected?.minOrderAmount ? (
        <p>
          Spend {formatMoney(Number(couponNearMiss.rejected.minOrderAmount), currency)} to unlock{" "}
          {couponNearMiss.title?.trim() || couponNearMiss.label?.trim() || "this offer"}.
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
