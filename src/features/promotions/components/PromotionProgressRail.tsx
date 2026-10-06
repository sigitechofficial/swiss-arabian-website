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
