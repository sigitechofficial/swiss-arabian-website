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
import { useConsent } from "@/lib/consent/useConsent";
import { setFirstPartyTracking } from "@/lib/analytics/tracker";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";

/**
 * Page view, engagement (visible seconds) and scroll depth for every route, sent to our own backend.
 * Renders nothing. Does nothing unless "First-party tracking" is on for this market in the admin
 * switchboard (settings phase 11), and nothing once the shopper refused analytics. Before a choice the
 * visit is recorded anonymously (tracker: per-page ids, nothing stored; §5.13 G4).
 */
export function PlatformTracker() {
  const pathname = usePathname();
  // Everything except a refusal: allowing analytics later keeps this value (no second page view).
  const choices = useConsent();
  const allowed = choices === null || choices.analytics === true;
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
