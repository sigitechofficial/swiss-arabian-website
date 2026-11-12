"use client";

import { useEffect, useRef } from "react";
import { acknowledgeJourneyEvents, fetchJourneyEvents } from "@/features/journeys/api/journeyEvents.service";
import {
  deliverJourneyEvents,
  toInsiderJourneyEvent,
} from "@/features/journeys/lib/deliverJourneyEvents";
import { env } from "@/lib/config/env";
import { insiderCustomEvent } from "@/lib/insider";
import { useAuthStore } from "@/stores/useAuthStore";

/** Default 60 s. NEXT_PUBLIC_JOURNEY_POLL_MS shortens it for testing (minimum 2 s). */
const POLL_INTERVAL_MS = Math.max(
  Number.parseInt(process.env.NEXT_PUBLIC_JOURNEY_POLL_MS ?? '', 10) || 60_000,
  2_000,
);

/**
 * Hands platform-owned journey events (checkout/cart abandonment eligibility) to the Insider SDK
 * for the signed-in customer, then acknowledges them. Renders nothing. Signed-out visitors are
 * skipped: the platform only serves events for identified customers.
 */
export function JourneyEventsPoller() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const customerId = useAuthStore((s) => s.user?.id ?? null);
  const seen = useRef<Set<string>>(new Set());
  const running = useRef(false);

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    if (!bootstrapped || !customerId) return;

    let cancelled = false;
    const run = async () => {
      if (running.current || cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      running.current = true;
      try {
        await deliverJourneyEvents({
          fetchEvents: () => fetchJourneyEvents(),
          acknowledge: (ids) => acknowledgeJourneyEvents(ids),
          fire: (event) => {
            const { name, custom } = toInsiderJourneyEvent(event);
            return insiderCustomEvent(name, custom);
          },
          seen: seen.current,
        });
      } catch {
        // Journey delivery must never break the storefront. Retried on the next tick.
      } finally {
        running.current = false;
      }
    };

    void run();
    const timer = window.setInterval(run, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [bootstrapped, customerId]);

  return null;
}
