"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  decideOnsiteMessage,
  fetchOnsiteTriggers,
  recordOnsiteEvent,
  type OnsiteContext,
} from "@/features/onsite/api/onsite.service";
import { OnsiteMessageView } from "@/features/onsite/components/OnsiteMessageView";
import { watchOnsiteTriggers } from "@/features/onsite/lib/watchTriggers";
import type { OnsiteMessage } from "@/features/onsite/types";
import { getSessionId, getVisitorId } from "@/lib/analytics/tracker";
import { env } from "@/lib/config/env";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useUiStore } from "@/stores/useUiStore";

/**
 * Shows the popup or banner the backend decides on. On each page it asks which triggers matter
 * here (for example "10 seconds on the page"), times them, and asks "what should I show now?" when
 * one fires. The backend applies audience, frequency, holdout and page guardrails; this component
 * only displays the answer and reports shown, clicked and dismissed. Failures are silent.
 */
export function OnsiteMessageHost() {
  const pathname = usePathname();
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const [message, setMessage] = useState<OnsiteMessage | null>(null);
  const contextRef = useRef<OnsiteContext | null>(null);
  const showing = useRef(false);

  useEffect(() => {
    if (!env.onsite.enabled) return;
    if (typeof window === "undefined") return;
    let cancelled = false;
    let stop: () => void = () => undefined;

    const context: OnsiteContext = {
      path: window.location.pathname,
      locale: localeFromPathname(window.location.pathname),
      zoneCode,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
    };
    contextRef.current = context;

    void (async () => {
      try {
        const triggers = await fetchOnsiteTriggers(context);
        if (cancelled || triggers.length === 0) return;
        stop = watchOnsiteTriggers(triggers, (trigger, observed) => {
          if (showing.current) return;
          void decideOnsiteMessage(context, {
            ...trigger,
            seconds: trigger.type === "dwell" ? observed.seconds : undefined,
            scrollPercent: trigger.type === "scroll" ? observed.scrollPercent : undefined,
          })
            .then((decided) => {
              if (cancelled || !decided || showing.current) return;
              showing.current = true;
              setMessage(decided);
              void recordOnsiteEvent(context, decided.ruleId, "SHOWN").catch(() => undefined);
            })
            .catch(() => undefined);
        });
      } catch {
        // On-site messages are optional: never disturb the page.
      }
    })();

    return () => {
      cancelled = true;
      stop();
      showing.current = false;
      setMessage(null);
    };
  }, [pathname, zoneCode]);

  const report = useCallback((type: "CLICKED" | "DISMISSED", ruleId: string) => {
    const context = contextRef.current;
    if (context) void recordOnsiteEvent(context, ruleId, type).catch(() => undefined);
  }, []);

  if (!message) return null;
  return (
    <OnsiteMessageView
      message={message}
      onDismiss={() => {
        report("DISMISSED", message.ruleId);
        setMessage(null);
      }}
      onCta={() => report("CLICKED", message.ruleId)}
    />
  );
}
