"use client";

import { useCartStore } from "@/stores/useCartStore";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import { shippingDiscountAmount } from "../types/promotions";
import { promotionConflictNotes } from "../utils/conflictNotes";
import { offerQualificationMessage } from "../utils/qualificationCopy";

export function PromotionUnlockNote({ className = "cart-ship-banner" }: { className?: string }) {
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const syncing = useCartStore((s) => s.syncing);
  const quotePending = syncing && totals == null;
  const currency = promotions?.context.currencyCode ?? totals?.currency ?? "AED";
  const { data } = useApplicablePromotions();
  const snapshot = data?.promotions ?? promotions;
  const shipOff = shippingDiscountAmount(snapshot);

  const qualificationNotes = (data?.offers ?? [])
    .map((offer) =>
      offerQualificationMessage(offer, currency, { shippingApplied: shipOff > 0 }),
    )
    .filter((note): note is string => Boolean(note));

  const conflicts = promotionConflictNotes(snapshot?.rejected);

  if (quotePending) return null;
  if (shipOff <= 0 && !qualificationNotes.length && !conflicts.length) return null;

  return (
    <div className={className} aria-live="polite">
      {shipOff > 0 ? <p>Free shipping applied.</p> : null}
      {qualificationNotes.map((note) => (
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
