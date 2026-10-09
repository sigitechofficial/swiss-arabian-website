"use client";

import { useEffect, useRef } from "react";
import { useApplicablePromotions } from "../hooks/useApplicablePromotions";
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
}: {
  surface?: string;
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
    const inset =
      surface === "drawer" ? "px-[22px] pt-3" : surface === "cart" ? "px-[22px] pt-5 pb-1" : "mb-4";
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
        <div className={inset} aria-live="polite">
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
      <div className={inset} aria-live="polite">
        {progress.primary ? <p className="m-0 line-clamp-2 text-[0.84rem] leading-snug text-[#3a342f]">{progress.primary.message}</p> : null}
        {progress.marks.length > 0 ? (
          <ol className="m-0 mt-3 flex list-none items-start p-0">
            {progress.marks.map((mark, index) => {
              const done = mark.state === "complete";
              const current = mark.state === "current";
              return (
                <li key={`${mark.label}-${mark.detail}`} className="relative min-w-0 flex-1 text-center" aria-label={`${mark.detail} ${mark.label}`}>
                  {index > 0 ? <span className={`absolute top-[7px] -left-1/2 h-px w-full ${done || current ? "bg-[#8c4435]" : "bg-[#e4d8cc]"}`} aria-hidden="true" /> : null}
                  <span className={`relative z-[1] mx-auto grid size-4 place-items-center rounded-full ${done ? "bg-[#8c4435] text-white" : current ? "bg-white ring-2 ring-[#8c4435]" : "bg-white ring-1 ring-[#e4d8cc]"}`}>
                    {done ? <span className="block h-[5px] w-[8px] -translate-y-px rotate-[-45deg] border-b-[1.5px] border-l-[1.5px] border-white" /> : null}
                  </span>
                  <strong className={`mt-1.5 block truncate text-[0.72rem] font-medium ${current || done ? "text-[#1c1917]" : "text-[#9a9086]"}`}>{mark.label}</strong>
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
