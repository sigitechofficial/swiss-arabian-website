"use client";

import { toast } from "@/components/ui/Toaster";

import { mySubscription } from "../data/mySubscriptionContent";

const ACTIONS = ["Skip next month", "Pause", "Cancel plan"];

/** Figma · Progress-Section (1236:9661) */
export function SubscriptionProgressPanel() {
  const { delivered, total } = mySubscription;
  const percent = Math.round((delivered / total) * 100);

  return (
    <div className="flex flex-col gap-4 border border-sa-border bg-surface px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-[15px]">
          <span className="font-bold text-sa-primary">
            {delivered} of {total}
          </span>{" "}
          <span className="text-sa-secondary">scents delivered</span>
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-section-soft"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={delivered}
          aria-label="Subscription deliveries"
        >
          <div
            className="h-full rounded-full bg-terra"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => toast(`${action} will be available soon.`, "info")}
            className="border border-sa-border px-3.5 py-2.5 text-[12px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
