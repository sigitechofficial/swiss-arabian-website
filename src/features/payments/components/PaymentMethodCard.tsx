"use client";

import { toast } from "@/components/ui/Toaster";

import type { SavedCardView } from "../types/payments";

type PaymentMethodCardProps = {
  card: SavedCardView;
};

/** Figma · Card-Mastercard / Card-Visa (1318:10015 · 1318:10025) */
export function PaymentMethodCard({ card }: PaymentMethodCardProps) {
  const gradient =
    card.brand === "Mastercard"
      ? "sa-grad-card-mastercard"
      : "sa-grad-card-visa";

  return (
    <article
      className={`${gradient} relative flex h-[206px] flex-col rounded-[14px] p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="sa-grad-card-chip h-[30px] w-[42px] rounded-md" />
        {card.isDefault ? (
          <span className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold tracking-wide text-[#221915]">
            DEFAULT
          </span>
        ) : (
          <button
            type="button"
            onClick={() => toast("Setting a default card will be available soon.", "info")}
            className="text-[11px] text-white/85 hover:text-white hover:underline"
          >
            Set as default
          </button>
        )}
      </div>

      <p className="mt-5 text-[18px] font-semibold tracking-wide text-white">
        •••• •••• •••• {card.last4}
      </p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-white/60">
            Card holder
          </p>
          <p className="text-[13px] text-white">
            {card.holder} &nbsp;·&nbsp; {card.expiryLabel}
          </p>
        </div>
        <p className="text-[15px] font-bold text-white">{card.brand}</p>
      </div>

      <div className="mt-auto flex gap-6 pt-4">
        <button
          type="button"
          onClick={() => toast("Card editing will be available soon.", "info")}
          className="text-[11px] text-white/85 hover:text-white hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => toast("Card removal will be available soon.", "info")}
          className="text-[11px] text-white/85 hover:text-white hover:underline"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

/** Figma · Card-Add (1318:10034) */
export function AddPaymentMethodCard() {
  return (
    <button
      type="button"
      onClick={() => toast("Adding a card will be available soon.", "info")}
      className="flex h-[206px] flex-col items-center justify-center gap-4 rounded-[14px] border border-dashed border-sa-border bg-section-soft transition-colors hover:border-terra"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full border border-sa-border text-[26px] leading-none text-terra"
        aria-hidden
      >
        +
      </span>
      <span className="text-[15px] text-sa-primary">Add a new card</span>
    </button>
  );
}
