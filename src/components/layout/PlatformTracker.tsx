"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startEngagementWatch } from "@/lib/analytics/engagement";
import {
  trackEngagementThreshold,
  trackPageViewed,
  trackRouteView,
  trackScrollDepth,
} from "@/lib/analytics/siteEvents";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { env } from "@/lib/config/env";
import { useConsentFor } from "@/lib/consent/useConsent";

/**
 * Page view, engagement (visible seconds) and scroll depth for every route, sent to our own backend.
 * Renders nothing. Does nothing unless NEXT_PUBLIC_TRACKING_ENABLED=true.
 */
export function PlatformTracker() {
  const pathname = usePathname();
  // Starts (and records this page) as soon as the shopper allows analytics.
  const allowed = useConsentFor("analytics");

  useEffect(() => {
    if (!env.tracking.enabled || !allowed) return;
    trackPageViewed(pathname);
    // Home, list, cart and checkout views are ours, not Insider's: they must not wait for its tag.
    trackRouteView(stripLocalePrefix(pathname || "/"));
    return startEngagementWatch({
      seconds: env.tracking.engagementSeconds,
      onThreshold: trackEngagementThreshold,
      onScrollDepth: trackScrollDepth,
    });
  }, [pathname, allowed]);

  return null;
}
