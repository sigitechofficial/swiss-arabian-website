"use client";

import { useEffect, useRef } from "react";
import type { PromotionProgressRail } from "../types/promotions";
import { trackPromotion } from "../utils/promotionAnalytics";

/**
 * Reports promotion progress once per change, for every brand's rail:
 * "promotion_progress_advanced" for the offer in progress and
 * "promotion_unlocked" when one is unlocked.
 */
export function usePromotionProgressTracking(
  progress: PromotionProgressRail | null | undefined,
  market: string | null,
  surface: string,
) {
  const tracked = useRef("");
  useEffect(() => {
    if (!progress) return;
    const key = `${progress.primary?.message ?? ""}|${progress.unlockedSummary ?? ""}|${progress.unlocked.map((line) => line.message).join("|")}`;
    if (tracked.current === key) return;
    tracked.current = key;
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
  }, [progress, market, surface]);
}
