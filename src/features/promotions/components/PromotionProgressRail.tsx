"use client";

import { useEffect, useRef } from "react";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
import type { ProgressMark } from "../types/promotions";
import { trackPromotion } from "../utils/promotionAnalytics";
import { PromotionUnlockNote } from "./PromotionUnlockNote";
import {
  promoMark,
  promoMarkComplete,
  promoMarkCurrent,
  promoMarks,
  promoMarkState,
  shipBarClass,
  shipCopy,
  shipFill,
  shipTrack,
  shipVariant,
} from "@/styles/cartChrome";

export function PromotionProgressRail({
  surface = "cart",
  inset = true,
}: {
  surface?: string;
  /** Footer and summary parents already pad the rail. */
  inset?: boolean;
}) {
  const { data } = useApplicablePromotions();
  const progress = data?.progress;
  const tracked = useRef("");

  useEffect(() => {
    if (!progress) return;
    const key = `${progress.primary?.message ?? ""}|${progress.unlockedSummary ?? ""}|${progress.unlocked.map((line) => line.message).join("|")}`;
    if (tracked.current === key) return;
    tracked.current = key;
    const market = data?.promotions.context.zoneCode ?? null;
    if (progress.primary) {
      trackPromotion("promotion_progress_advanced", {
        campaignCode: progress.primary.campaignCode,
        mechanic: progress.primary.mechanic,
        market,
        surface,
      });
    }
    if (progress.unlockedSummary || progress.unlocked.length) {
      trackPromotion("promotion_unlocked", {
        campaignCode: progress.unlocked[0]?.campaignCode ?? progress.primary?.campaignCode,
        mechanic: progress.unlocked[0]?.mechanic ?? null,
        market,
        surface,
      });
    }
  }, [progress, data?.promotions.context.zoneCode, surface]);

  if (!progress) return <PromotionUnlockNote surface={surface} />;
  if (!progress.primary && !progress.unlockedSummary && !progress.unlocked.length && !progress.secondary.length && !progress.marks.length) {
    return null;
  }

  const meter = progress.primary && progress.primaryProgress != null ? progress.primaryProgress : null;
  const methodGap = /delivery method|طريقة توصيل/i.test(progress.primary?.message ?? "");
  const variant = shipVariant(surface);
  const markClass = (state: string) =>
    [promoMark, state === "complete" ? promoMarkComplete : "", state === "current" ? promoMarkCurrent : ""]
      .filter(Boolean)
      .join(" ");

  // Bag drawer, bag page and checkout summary share the compact rail: a "saved"
  // banner or bundle steps plus one note. Free gifts are listed as their own line
  // on all three, so the GWP unlock sentence and offer-conflict notes would only add noise.
  if (surface === "drawer" || surface === "cart" || surface === "checkout") {
    const insetClass = !inset
      ? "pb-0"
      : surface === "drawer"
        ? "px-[22px] pt-3"
        : surface === "cart"
          ? "px-[22px] pt-5 pb-1"
          : "mb-4";
    const note =
      progress.unlockedSummary ||
      progress.unlocked.find((line) => line.mechanic !== "GWP")?.message ||
      null;
    const headline = progress.primary?.message ?? note;
    if (!headline && !progress.marks.length) return null;
    const stillOpen = progress.marks.some((mark) => mark.state !== "complete");
    const saved = headline != null && /saved\s+\d+\s*%|وفرت\s+\d+/i.test(headline) && !/add\s+\d|أضف/i.test(headline) && !stillOpen;
    if (saved && headline) {
      return (
        <div className={insetClass} aria-live="polite">
          <div className="flex items-center gap-2.5 rounded-full bg-[#8c4435] px-2.5 py-2 text-white" data-bundle-saved>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white" aria-hidden="true">
              <span className="block h-[5px] w-[9px] -translate-y-px rotate-[-45deg] border-b-2 border-l-2 border-[#8c4435]" />
            </span>
            <p className="m-0 text-[0.84rem] leading-snug">
              {headline.split(/(\d+\s*%)/).map((part, index) => (
                /^\d+\s*%$/.test(part)
                  ? <strong key={index} className="text-[0.98rem] font-semibold">{part}</strong>
                  : <span key={index}>{part}</span>
              ))}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className={insetClass} aria-live="polite">
        {progress.primary ? (
          progress.marks.some((mark) => mark.rewardType) ? (
            <RewardHeadline message={progress.primary.message} />
          ) : (
            <p className="m-0 line-clamp-2 font-sans text-[0.84rem] leading-snug text-[#3a342f]">{progress.primary.message}</p>
          )
        ) : null}
        {progress.marks.length > 0 && progress.marks.some((mark) => mark.rewardType) ? (
          <RewardRange marks={progress.marks} tone={surface === "drawer" ? "cream" : "paper"} />
        ) : progress.marks.length > 0 ? (
          <ol className="m-0 mt-3 flex list-none items-start p-0">
            {progress.marks.map((mark, index) => {
              const done = mark.state === "complete";
              const current = mark.state === "current";
              const reward = Boolean(mark.rewardType);
              return (
                <li key={`${mark.tierId ?? mark.label}-${mark.detail}-${index}`} className="relative min-w-0 flex-1 text-center" aria-label={`${mark.label} ${mark.detail}`}>
                  {index > 0 ? <span className={`absolute top-[11px] -left-1/2 h-px w-full ${done || current ? "bg-[#8c4435]" : "bg-[#e4d8cc]"}`} aria-hidden="true" /> : null}
                  <span className={`relative z-[1] mx-auto grid place-items-center rounded-full ${reward ? "size-6" : "size-4"} ${done ? "bg-[#8c4435] text-white" : current ? "bg-white ring-2 ring-[#8c4435]" : "bg-white ring-1 ring-[#e4d8cc] text-[#9a9086]"}`}>
                    {done ? <span className="block h-[5px] w-[8px] -translate-y-px rotate-[-45deg] border-b-[1.5px] border-l-[1.5px] border-white" /> : <RewardMarkIcon type={mark.rewardType} done={false} />}
                  </span>
                  <strong className={`mt-1.5 block truncate text-[0.72rem] font-medium ${current || done ? "text-[#1c1917]" : "text-[#9a9086]"}`}>{mark.label}</strong>
                  {reward && mark.detail ? <span className="mt-0.5 block truncate text-[0.68rem] text-[#6f6152]">{mark.detail}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : meter != null && !methodGap ? (
          <div
            className={`${shipTrack.drawer} mt-3`}
            data-ship-track=""
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(meter)}
            aria-valuetext={progress.primary?.message}
          >
            <div className={shipFill.drawer} style={{ width: `${Math.round(meter)}%` }} />
          </div>
        ) : null}
        {note ? <p className="m-0 mt-2 text-[0.75rem] text-[#6f6152]">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className={shipBarClass(variant)} aria-live="polite">
      {progress.primary ? <p className={shipCopy[variant]}>{progress.primary.message}</p> : null}
      {progress.marks.length > 0 ? (
        <ol className={promoMarks}>
          {progress.marks.map((mark) => (
            <li className={markClass(mark.state)} key={`${mark.label}-${mark.detail}`}>
              <span className={promoMarkState}>{mark.detail}</span>
              <strong>{mark.label}</strong>
            </li>
          ))}
        </ol>
      ) : null}
      {meter != null && !methodGap ? (
        <div
          className={shipTrack[variant]}
          data-ship-track=""
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(meter)}
          aria-valuetext={progress.primary?.message}
        >
          <div className={shipFill[variant]} style={{ width: `${Math.round(meter)}%` }} />
        </div>
      ) : null}
      {progress.unlockedSummary ? <p className={shipCopy[variant]}>{progress.unlockedSummary}</p> : null}
      {progress.unlocked.map((line) => (
        <p className={shipCopy[variant]} key={`${line.campaignCode}:${line.message}`}>{line.message}</p>
      ))}
      {progress.secondary.map((line) => (
        <p className={shipCopy[variant]} key={`${line.mechanic}:${line.message}`}>
          {line.message}
        </p>
      ))}
    </div>
  );
}

function rewardFill(marks: ProgressMark[]): number {
  const thresholds = marks.map((mark) => Number(mark.threshold));
  const count = marks.length;
  if (!count || thresholds.some((value) => !Number.isFinite(value) || value <= 0)) return 0;
  const center = (index: number) => ((index + 0.5) / count) * 100;
  const next = marks.find(
    (mark) => mark.state === "current" && mark.threshold != null && mark.amountRemaining != null,
  );
  let current = 0;
  if (next) {
    current = Math.max(0, Number(next.threshold) - Number(next.amountRemaining));
  } else if (marks.every((mark) => mark.state === "complete")) {
    return 100;
  } else {
    const done = [...marks].reverse().find((mark) => mark.state === "complete");
    current = Number(done?.threshold) || 0;
  }
  if (!Number.isFinite(current) || current <= 0) return 0;
  if (current >= thresholds[count - 1]) return 100;
  let previousAmount = 0;
  let previousAt = 0;
  for (let index = 0; index < count; index += 1) {
    const at = index === count - 1 ? 100 : center(index);
    if (current <= thresholds[index]) {
      const span = thresholds[index] - previousAmount;
      const ratio = span <= 0 ? 1 : (current - previousAmount) / span;
      return previousAt + (at - previousAt) * ratio;
    }
    previousAmount = thresholds[index];
    previousAt = at;
  }
  return 100;
}

function RewardHeadline({ message }: { message: string }) {
  const parts = message.split(/(\b[A-Z]{3}\s[\d,]+(?:\.\d+)?)/);
  return (
    <p className="m-0 font-sans text-[0.92rem] leading-snug text-[#2c241c]">
      {parts.map((part, index) =>
        /^[A-Z]{3}\s[\d,]+/.test(part) ? (
          <strong key={index} className="font-semibold">{part}</strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

function RewardRange({ marks, tone }: { marks: ProgressMark[]; tone: "cream" | "paper" }) {
  const fill = Math.max(0, Math.min(100, rewardFill(marks)));
  const idle = tone === "cream" ? "bg-[var(--cream,#faf6ee)]" : "bg-white";
  return (
    <div className="relative mt-3.5 font-sans">
      <span className="absolute top-3 right-0 left-0 h-0.5 -translate-y-1/2 rounded-full bg-[#eadfd2]" aria-hidden="true" />
      <span
        className="absolute top-3 left-0 h-0.5 -translate-y-1/2 rounded-full bg-[#8c4435] transition-[width] duration-500 ease-out"
        style={{ width: `${fill}%` }}
        aria-hidden="true"
      />
      <ol className="relative m-0 flex list-none p-0">
        {marks.map((mark, index) => {
          const done = mark.state === "complete";
          return (
            <li key={`${mark.tierId ?? mark.label}-${mark.detail}-${index}`} className="min-w-0 flex-1 text-center" aria-label={`${mark.label} ${mark.detail}`}>
              <span className={`relative z-[1] mx-auto grid size-[26px] place-items-center rounded-full ${done ? "bg-[#8c4435] text-white" : `${idle} text-[#b3a496] ring-1 ring-[#e7d8c8]`}`}>
                {done ? <span className="block h-[5px] w-[8px] -translate-y-px rotate-[-45deg] border-b-[1.5px] border-l-[1.5px] border-white" /> : <RewardMarkIcon type={mark.rewardType} done={false} />}
              </span>
              <strong className={`mt-2 block truncate text-[0.78rem] leading-tight font-semibold ${done ? "text-[#1c1917]" : "text-[#b3a496]"}`}>{mark.label}</strong>
              {mark.detail ? <span className="mt-0.5 block truncate text-[0.7rem] font-normal text-[#b3a496]">{mark.detail}</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function RewardMarkIcon({ type, done }: { type?: string; done: boolean }) {
  const stroke = done ? "#fff" : "currentColor";
  if (type === "FREE_GIFT") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <rect x="1.5" y="5" width="9" height="5.5" rx="0.6" fill="none" stroke={stroke} strokeWidth="1" />
        <path d="M1.5 5h9M6 5v5.5M3.2 5c0-1.3 1-2.2 2.1-1.4.4.3.7.8.7 1.4M8.8 5c0-1.3-1-2.2-2.1-1.4-.4.3-.7.8-.7 1.4" fill="none" stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  if (type === "FREE_SHIPPING") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M1 7.5V4.5h6.2v3M7.2 5.2h2.1L11 7.2v1.8H1" fill="none" stroke={stroke} strokeWidth="1" />
        <circle cx="3.2" cy="9" r="0.8" fill={stroke} />
        <circle cx="8.8" cy="9" r="0.8" fill={stroke} />
      </svg>
    );
  }
  if (type === "PERCENTAGE") {
    return <span className="text-[0.62rem] font-semibold leading-none">%</span>;
  }
  if (type === "FIXED_AMOUNT") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 7.2 7.2 2l2.6 2.6L4.6 9.8 2 7.2z" fill="none" stroke={stroke} strokeWidth="1" />
        <circle cx="8.2" cy="3.6" r="0.6" fill={stroke} />
      </svg>
    );
  }
  return null;
}
