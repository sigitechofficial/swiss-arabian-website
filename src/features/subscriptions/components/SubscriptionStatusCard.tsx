"use client";

import Image from "next/image";

import { toast } from "@/components/ui/Toaster";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";

import { mySubscription } from "../data/mySubscriptionContent";

/** Figma · Status-Card (1236:9635) */
export function SubscriptionStatusCard() {
  const { statusLabel, planName, details, nextDelivery } = mySubscription;

  return (
    <div className="overflow-hidden rounded-lg border border-sa-border">
      <div className="grid lg:grid-cols-[minmax(0,660fr)_minmax(0,580fr)]">
        <div className="bg-surface px-6 py-7 sm:px-8">
          <AccountStatusPill label={statusLabel} tone="success" />
          <h2 className="mt-3 text-[18px] font-bold text-sa-primary lg:text-[20px]">
            {planName}
          </h2>
          <dl className="mt-5">
            {details.map((row, index) => (
              <div
                key={row.label}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 ${
                  index === 0 ? "" : "border-t border-sa-border"
                }`}
              >
                <dt className="w-full text-[13px] text-sa-secondary sm:w-[188px]">
                  {row.label}
                </dt>
                <dd className="text-[13px] font-semibold text-sa-primary">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="sa-grad-subscription relative flex flex-col justify-center px-6 py-9 sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
            {nextDelivery.eyebrow}
          </p>
          <p className="mt-1 text-[22px] font-bold text-white lg:text-[26px]">
            {nextDelivery.scent}
          </p>
          <p className="mt-2 text-[13px] text-white/70">{nextDelivery.note}</p>
          <button
            type="button"
            onClick={() => toast("Scent swapping will be available soon.", "info")}
            className="mt-6 w-fit rounded-sm bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#221915] transition-opacity hover:opacity-90"
          >
            Swap this scent
          </button>

          <div className="relative mt-8 h-[160px] w-[160px] self-end overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.3)] lg:absolute lg:right-0 lg:top-[29px] lg:mt-0 lg:h-[220px] lg:w-[220px] lg:translate-x-0">
            <Image
              src={nextDelivery.image}
              alt={nextDelivery.scent}
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
