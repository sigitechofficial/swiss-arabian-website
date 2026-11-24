"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackWebVital, type WebVitalMetric } from "@/lib/analytics/siteEvents";
import { stripLocalePrefix } from "@/lib/i18n/localePath";

// The page this load started on: CLS and INP arrive when the page is hidden, maybe after the
// shopper moved on, and belong to the page that was loaded.
let loadPath: string | null = null;

// A stable function: Next calls a new one again with every metric so far.
function report(metric: WebVitalMetric): void {
  if (typeof window === "undefined") return;
  loadPath ??= stripLocalePrefix(window.location.pathname || "/");
  trackWebVital(metric, loadPath);
}

/**
 * Core Web Vitals (LCP, INP, CLS) of each page load, for the web performance reports. Renders
 * nothing; sent through the first-party tracker, so only with the market's first-party tracking
 * switch on and the shopper's analytics consent.
 */
export function WebVitalsTracker() {
  useReportWebVitals(report);
  return null;
}
