"use client";

import Link from "next/link";

import {
  MONTH_LABELS,
  type QueueProduct,
} from "@/features/subscriptions/data/subscriptionContent";

type QueuePanelProps = {
  queue: Array<QueueProduct | null>;
  onRemoveAt: (index: number) => void;
  onSubscribe: () => void;
};

/** Figma · queue-panel 336:94 */
export function QueuePanel({ queue, onRemoveAt, onSubscribe }: QueuePanelProps) {
  return (
    <section
      className="mx-auto mt-10 max-w-[1200px] border border-sa-border bg-surface p-6 sm:p-8"
      aria-labelledby="queue-heading"
    >
      <h2
        id="queue-heading"
        className="text-center font-sans text-[clamp(1.35rem,2.5vw,1.625rem)] font-medium text-sa-primary"
      >
        Your 12-month fragrance{" "}
        <em className="font-medium italic text-terra">queue</em>
      </h2>
      <p className="mt-3 text-center text-[13px] text-sa-secondary">
        One scent from your queue arrives each month
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {MONTH_LABELS.map((month, index) => {
          const product = queue[index] ?? null;
          if (product) {
            return (
              <div
                key={month}
                className="flex h-[110px] flex-col items-center justify-center gap-1.5 border-[1.5px] border-gold bg-surface px-2 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">
                  {month}
                </p>
                <p className="line-clamp-2 text-[12.5px] font-semibold text-sa-primary">
                  {product.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveAt(index)}
                  className="min-h-11 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-sa-secondary hover:text-terra"
                >
                  Remove ✕
                </button>
              </div>
            );
          }
          return (
            <div
              key={month}
              className="flex h-[110px] flex-col items-center justify-center gap-1.5 border border-dashed border-sa-input bg-section-soft px-2 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">
                {month}
              </p>
              <p className="text-[22px] text-terra" aria-hidden>
                +
              </p>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sa-secondary">
                Curated pick
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[12.5px] leading-[1.6] text-sa-secondary">
        Your plan is fully flexible — update choices or cancel anytime, no
        penalties.
        <br />
        Empty slots receive our curated pick for that month.
      </p>

      <div className="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        <button
          type="button"
          onClick={onSubscribe}
          className="flex h-[42px] w-full max-w-[280px] items-center justify-center bg-terra px-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#A25E48]"
        >
          Subscribe with this queue
        </button>
        <Link
          href="#fragrance-picker"
          className="border-b-2 border-terra pb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-primary"
        >
          Browse more fragrances
        </Link>
      </div>
    </section>
  );
}
