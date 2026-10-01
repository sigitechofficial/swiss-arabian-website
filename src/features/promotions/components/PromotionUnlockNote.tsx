"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useFreeShippingBar } from "../hooks/useFreeShippingBar";
import { promotionConflictNotes } from "../utils/conflictNotes";
import { offerQualificationMessage } from "../utils/qualificationCopy";

export function PromotionUnlockNote({ className = "cart-ship-banner" }: { className?: string }) {
  const { isFree, progress, remaining, threshold, currency, snapshot, offers, quotePending } =
    useFreeShippingBar();
  const [whoop, setWhoop] = useState(false);
  const wasFreeRef = useRef<boolean | null>(null);

  const qualificationNotes = offers
    .map((offer) =>
      offerQualificationMessage(offer, currency, { shippingApplied: isFree }),
    )
    .filter((note): note is string => Boolean(note));

  const conflicts = promotionConflictNotes(snapshot?.rejected);
  const showBar = threshold != null || isFree;

  useEffect(() => {
    const previouslyFree = wasFreeRef.current;
    wasFreeRef.current = isFree;
    if (!isFree || previouslyFree !== false) return;
    setWhoop(true);
    const id = window.setTimeout(() => setWhoop(false), 1100);
    return () => window.clearTimeout(id);
  }, [isFree]);

  if (quotePending) return null;
  if (!showBar && !qualificationNotes.length && !conflicts.length) return null;

  const classes = [className, isFree ? "is-free" : "", whoop ? "is-whoop" : ""]
    .filter(Boolean)
    .join(" ");

  const barCopy = isFree
    ? null
    : qualificationNotes[0] ??
      (threshold != null
        ? `Spend ${formatMoney(remaining, currency)} to unlock free shipping`
        : null);

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
              barCopy
            )}
          </p>
          <div className="cart-ship-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div
              className="cart-ship-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </>
      ) : null}
      {!showBar
        ? qualificationNotes.map((note) => (
            <p key={note}>{note}</p>
          ))
        : qualificationNotes.slice(1).map((note) => (
            <p key={note}>{note}</p>
          ))}
      {conflicts.map((note) => (
        <p className="promo-conflict" key={note}>
          {note}
        </p>
      ))}
    </div>
  );
}
