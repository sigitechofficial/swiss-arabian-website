"use client";

import { useState } from "react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { toast } from "@/components/ui/Toaster";

import { accountContainer } from "../constants/accountLayout";
import {
  REWARD_ACTIVITY,
  REWARD_EARN_METHODS,
  REWARD_REDEEM_OFFERS,
  REWARDS_SUMMARY,
  type RewardEarnMethod,
} from "../data/accountRewardsContent";
import { AccountBreadcrumb } from "./AccountBreadcrumb";
import { AccountPageShell } from "./AccountPageShell";

/** Account Rewards & loyalty — Figma 156:1344, Swiss Arabian DS. */
export function AccountRewardsPageView() {
  const [points, setPoints] = useState<number>(REWARDS_SUMMARY.points);
  const [activity, setActivity] = useState(REWARD_ACTIVITY);

  const progress = Math.min(
    1,
    points / (points + REWARDS_SUMMARY.pointsToNext),
  );

  function redeem(offerId: string) {
    const offer = REWARD_REDEEM_OFFERS.find((item) => item.id === offerId);
    if (!offer) return;
    if (points < offer.points) {
      toast("Not enough points for this reward yet.", "info");
      return;
    }
    setPoints((current) => current - offer.points);
    setActivity((rows) => [
      {
        id: `local-${Date.now()}`,
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        title: `Redeemed · ${offer.title}`,
        detail: "Simulated redemption",
        points: -offer.points,
      },
      ...rows,
    ]);
    toast(`${offer.title} redeemed.`, "success");
  }

  return (
    <AccountPageShell>
      <AccountBreadcrumb label="Rewards & loyalty" />

      <div className={`${accountContainer} flex flex-wrap items-start justify-between gap-4 pb-2 pt-7 sm:pt-8`}>
        <div className="min-w-0 max-w-[720px]">
          <h1 className="text-[25px] font-bold leading-tight text-sa-primary sm:text-[30px] lg:text-[36px]">
            Rewards &amp; loyalty
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-sa-secondary">
            Earn points on every order, unlock member perks, and redeem them
            for shipping, samples and discounts.
          </p>
        </div>
        <div className="flex items-center gap-3 border border-sa-border bg-page px-3 py-2 dark:bg-surface">
          <span className="size-1.5 shrink-0 bg-gold" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-sa-primary">
            {REWARDS_SUMMARY.tier}
          </span>
          <span className="text-[12px] text-sa-muted">
            {points.toLocaleString()} points
          </span>
        </div>
      </div>

      <div className={`${accountContainer} flex flex-col gap-12 pb-16 pt-4`}>
        <Reveal>
          <section
            className="flex flex-col gap-6 bg-inverse px-6 py-7 text-cream sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8"
            aria-label="Points summary"
          >
            <div>
              <p className="font-sans text-[48px] font-medium leading-none tracking-[-0.03em] sm:text-[56px]">
                {points.toLocaleString()}
              </p>
              <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-cream/70">
                points
              </p>
              <p className="mt-3 max-w-[360px] text-[13px] leading-relaxed text-cream/65">
                Worth roughly ${REWARDS_SUMMARY.valueEstimateUsd} in rewards ·
                earned on {REWARDS_SUMMARY.ordersCount} orders.
              </p>
            </div>

            <div className="w-full max-w-[340px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-light">
                {REWARDS_SUMMARY.tier}
              </p>
              <div
                className="mt-3 h-1.5 w-full bg-white/20"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress to next tier"
              >
                <div
                  className="h-full bg-cream transition-[width] duration-500"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-cream/70">
                {REWARDS_SUMMARY.pointsToNext} points until{" "}
                {REWARDS_SUMMARY.nextTier} — early access to launches &amp; free
                returns.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="earn-heading">
            <h2
              id="earn-heading"
              className="text-[18px] font-semibold text-sa-primary sm:text-[20px]"
            >
              How you earn
            </h2>
            <Stagger className="mt-5 grid gap-4 md:grid-cols-3">
              {REWARD_EARN_METHODS.map((method) => (
                <StaggerItem key={method.id}>
                  <article className="flex h-full flex-col gap-3 border border-sa-border bg-page px-5 py-6 dark:bg-surface">
                    <EarnIcon type={method.icon} />
                    <h3 className="text-[15px] font-semibold text-sa-primary">
                      {method.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-sa-muted">
                      {method.description}
                    </p>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="redeem-heading">
            <h2
              id="redeem-heading"
              className="text-[18px] font-semibold text-sa-primary sm:text-[20px]"
            >
              Redeem your points
            </h2>
            <Stagger className="mt-5 grid gap-4 sm:grid-cols-2">
              {REWARD_REDEEM_OFFERS.map((offer) => {
                const canRedeem = points >= offer.points;
                return (
                  <StaggerItem key={offer.id}>
                    <article className="flex h-full flex-col border border-sa-border bg-page px-5 py-6 dark:bg-surface">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-terra">
                        {offer.points} points
                      </p>
                      <h3 className="mt-2 text-[16px] font-semibold text-sa-primary">
                        {offer.title}
                      </h3>
                      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-sa-muted">
                        {offer.description}
                      </p>
                      <button
                        type="button"
                        disabled={!canRedeem}
                        onClick={() => redeem(offer.id)}
                        className="mt-5 w-fit bg-terra px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[var(--sa-action-primary-hover)] disabled:cursor-not-allowed disabled:bg-sa-border disabled:text-sa-muted"
                      >
                        Redeem
                      </button>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
            <p className="mt-4 text-[12px] text-sa-muted">
              Redeeming here is simulated for the prototype — points update on
              screen and reset when you reload.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="activity-heading">
            <h2
              id="activity-heading"
              className="text-[18px] font-semibold text-sa-primary sm:text-[20px]"
            >
              Points activity
            </h2>
            <div className="mt-5 overflow-x-auto border border-sa-border">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-sa-border bg-section-soft">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-sa-border last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-[13px] text-sa-muted">
                        {row.date}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[14px] font-medium text-sa-primary">
                          {row.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-sa-muted">
                          {row.detail}
                        </p>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right text-[14px] font-semibold tabular-nums ${
                          row.points < 0 ? "text-terra" : "text-sa-primary"
                        }`}
                      >
                        {row.points > 0 ? `+${row.points}` : row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      </div>
    </AccountPageShell>
  );
}

function EarnIcon({ type }: { type: RewardEarnMethod["icon"] }) {
  const common =
    "text-terra [&_path]:stroke-current [&_circle]:stroke-current [&_rect]:stroke-current";

  if (type === "shop") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className={common}
      >
        <rect x="3" y="7" width="16" height="11" strokeWidth="1.4" />
        <path d="M3 10h16" strokeWidth="1.4" />
        <path d="M7 7V5.5a4 4 0 0 1 8 0V7" strokeWidth="1.4" />
      </svg>
    );
  }

  if (type === "review") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className={common}
      >
        <path
          d="M11 3.5 12.9 8.2l5.1.4-3.9 3.3 1.2 5-4.3-2.6-4.3 2.6 1.2-5-3.9-3.3 5.1-.4L11 3.5Z"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className={common}
    >
      <path d="M4 9h14v9H4V9Z" strokeWidth="1.4" />
      <path d="M4 9h14V7H4v2Z" strokeWidth="1.4" />
      <path d="M11 7V18" strokeWidth="1.4" />
      <path d="M8.5 7c0-1.5 1-2.5 2.5-2.5S13.5 5.5 13.5 7" strokeWidth="1.4" />
    </svg>
  );
}
