"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useFreeShippingBar } from "../hooks/useFreeShippingBar";
import { promotionConflictNotes } from "../utils/conflictNotes";
import { offerQualificationMessage } from "../utils/qualificationCopy";
import { setBundleNotes } from "../utils/setBundlePresentation";
import {
  shipBarClass,
  shipCopy,
  shipCopyFree,
  shipFill,
  shipTrack,
  shipVariant,
  shipWhoopCheck,
} from "@/styles/cartChrome";

export function PromotionUnlockNote({ surface = "cart" }: { surface?: string }) {
  const { isFree, unlocked, progress, remaining, threshold, currency, snapshot, offers } =
    useFreeShippingBar();
  const [whoop, setWhoop] = useState(false);
  const wasFreeRef = useRef<boolean | null>(null);

  const qualificationNotes = offers
    .map((offer) =>
      offerQualificationMessage(offer, currency, { shippingApplied: unlocked }),
    )
    .filter((note): note is string => Boolean(note));

  const conflicts = promotionConflictNotes(snapshot?.rejected);
  const bundleNotes = setBundleNotes(offers, snapshot);
  const showBar = threshold != null || isFree;

  useEffect(() => {
    const previouslyFree = wasFreeRef.current;
    wasFreeRef.current = unlocked;
    if (!unlocked || previouslyFree !== false) return;
    setWhoop(true);
    const id = window.setTimeout(() => setWhoop(false), 1100);
    return () => window.clearTimeout(id);
  }, [unlocked]);

  if (!showBar && !qualificationNotes.length && !conflicts.length && !bundleNotes.length) return null;

  const variant = shipVariant(surface);
  const classes = shipBarClass(variant);

  const barCopy = unlocked
    ? null
    : threshold != null
      ? `Spend ${formatMoney(remaining, currency)} to unlock free shipping`
      : (qualificationNotes[0] ?? null);

  return (
    <div
      className={classes}
      data-free={unlocked ? "" : undefined}
      data-whoop={whoop ? "" : undefined}
      aria-live="polite"
    >
      {showBar ? (
        <>
          <p className={unlocked ? `${shipCopy[variant]} ${shipCopyFree[variant]}` : shipCopy[variant]}>
            {unlocked ? (
              <>
                <span className={shipWhoopCheck} aria-hidden="true" />
                You&apos;ve unlocked free shipping
              </>
            ) : (
              barCopy
            )}
          </p>
          <div className={shipTrack[variant]} data-ship-track="" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div
              className={shipFill[variant]}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </>
      ) : null}
      {(showBar
        ? qualificationNotes.filter((note) => !/free shipping/i.test(note))
        : qualificationNotes
      ).map((note) => (
        <p className={shipCopy[variant]} key={note}>{note}</p>
      ))}
      {conflicts.map((note) => (
        <p className={shipCopy[variant]} key={note}>
          {note}
        </p>
      ))}
      {bundleNotes.map((note) => (
        <p className={shipCopy[variant]} key={note}>{note}</p>
      ))}
    </div>
  );
}
