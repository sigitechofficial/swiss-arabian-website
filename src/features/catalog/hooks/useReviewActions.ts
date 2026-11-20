"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useAuthStore } from "@/stores/useAuthStore";
import { markReviewHelpful, reportReview } from "../api/reviews.service";
import type { StorefrontPublicReview } from "../types/pdpReviews";

/**
 * "Helpful" and "Report" under a review, for every brand. Signed-in customers
 * only (one vote each); guests are sent to sign in and come back to `anchor`.
 * Each brand draws its own buttons and shows `onError` / `onReported` its way.
 */
export function useReviewActions(
  review: StorefrontPublicReview,
  {
    anchor,
    onError,
    onReported,
  }: { anchor: string; onError: (error: unknown) => void; onReported?: () => void },
) {
  const router = useLocaleRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [count, setCount] = useState(review.helpfulCount);
  const [marked, setMarked] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const needSignIn = () => {
    if (isAuthenticated) return false;
    router.push(`/login?returnTo=${encodeURIComponent(`${pathname}#${anchor}`)}`);
    return true;
  };

  const toggleHelpful = async () => {
    if (needSignIn() || busy) return;
    setBusy(true);
    try {
      const next = await markReviewHelpful(review.reviewId, !marked);
      setMarked(!marked);
      setCount((n) => next ?? Math.max(0, n + (marked ? -1 : 1)));
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const sendReport = async () => {
    if (needSignIn() || busy) return;
    setBusy(true);
    try {
      await reportReview(review.reviewId);
      setReported(true);
      setConfirming(false);
      onReported?.();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  return { count, marked, reported, confirming, setConfirming, busy, toggleHelpful, sendReport };
}
