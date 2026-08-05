"use client";

import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { planFeatures } from "@/features/subscriptions/data/subscriptionContent";

type Gender = "male" | "female";

type SubscribePlanSectionProps = {
  gender: Gender;
  onGenderChange: (g: Gender) => void;
  chooseFragrances: boolean;
  onChooseFragrancesChange: (v: boolean) => void;
  onSubscribe: () => void;
};

/** Figma · Subscribe Now / Pricing Card 335:3404 */
export function SubscribePlanSection({
  gender,
  onGenderChange,
  chooseFragrances,
  onChooseFragrancesChange,
  onSubscribe,
}: SubscribePlanSectionProps) {
  return (
    <section className="px-4 pt-14 sm:px-6 lg:px-10" aria-labelledby="subscribe-now">
      <CenteredSectionHead
        eyebrow="Pricing"
        title={
          <>
            Subscribe <Accent>Now</Accent>
          </>
        }
      />

      <p className="mt-10 text-center text-[13px] font-semibold text-sa-primary">
        What type of fragrance are you looking for?
      </p>

      <div
        className="mx-auto mt-6 flex w-fit border border-sa-border p-1"
        role="group"
        aria-label="Fragrance gender"
      >
        {(["male", "female"] as const).map((option) => {
          const active = gender === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onGenderChange(option)}
              className={`min-w-[100px] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "bg-terra text-white"
                  : "bg-transparent text-sa-secondary hover:text-sa-primary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-7 w-full max-w-[480px] border border-sa-border bg-surface px-8 pb-7 pt-8 shadow-[0_12px_15px_rgba(24,24,27,0.1)]">
        <span className="inline-block border border-terra px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-terra">
          Monthly Plan
        </span>

        <div className="mt-[18px] flex items-baseline gap-2">
          <span className="text-[14px] font-semibold uppercase tracking-[0.1em] text-sa-secondary">
            AED
          </span>
          <span className="font-sans text-[56px] font-light leading-none text-sa-primary">
            55
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-[1.5] text-sa-secondary">
          per month · 10ml refillable atomizer
        </p>

        <ul className="mt-[18px] flex flex-col gap-2.5">
          {planFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5">
              <span className="text-[13px] font-bold text-terra" aria-hidden>
                ✓
              </span>
              <span className="text-[14px] leading-[1.5] text-sa-primary">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSubscribe}
          className="mt-[18px] flex w-full items-center justify-center bg-terra py-[11px] text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#A25E48]"
        >
          Subscribe Now
        </button>

        <p className="mt-3 text-center text-[12px] text-sa-secondary">
          We will ship the fragrance of each month
        </p>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[480px] items-center gap-3">
        <div className="h-px flex-1 bg-sa-border" />
        <span className="text-[13px] text-sa-secondary">or</span>
        <div className="h-px flex-1 bg-sa-border" />
      </div>

      <div className="mx-auto mt-6 flex w-fit items-center gap-4">
        <span className="text-[13px] font-semibold text-sa-primary">
          Choose Your Desired Fragrances
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={chooseFragrances}
          onClick={() => onChooseFragrancesChange(!chooseFragrances)}
          className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors ${
            chooseFragrances ? "bg-terra" : "bg-sa-border"
          }`}
        >
          <span
            className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
              chooseFragrances ? "translate-x-[24px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
