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
import { setFirstPartyTracking } from "@/lib/analytics/tracker";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";

/**
 * Page view, engagement (visible seconds) and scroll depth for every route, sent to our own backend.
 * Renders nothing. Does nothing unless "First-party tracking" is on for this market in the admin
 * switchboard (settings phase 11) and the shopper allows analytics.
 */
export function PlatformTracker() {
  const pathname = usePathname();
  // Starts (and records this page) as soon as the shopper allows analytics.
  const allowed = useConsentFor("analytics");
  const on = useSiteIntegrations().firstPartyTracking === true;

  // Every track() call on the site follows the market's switch.
  useEffect(() => {
    setFirstPartyTracking(on);
  }, [on]);

  useEffect(() => {
    if (!on || !allowed) return;
    trackPageViewed(pathname);
    // Home, list, cart and checkout views are ours, not Insider's: they must not wait for its tag.
    trackRouteView(stripLocalePrefix(pathname || "/"));
    return startEngagementWatch({
      seconds: env.tracking.engagementSeconds,
      onThreshold: trackEngagementThreshold,
      onScrollDepth: trackScrollDepth,
    });
  }, [pathname, allowed, on]);

  return null;
}
