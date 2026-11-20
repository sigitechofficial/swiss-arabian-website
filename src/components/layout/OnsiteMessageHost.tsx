"use client";

import { useConsentFor } from "@/lib/consent/useConsent";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  decideOnsiteMessage,
  fetchOnsitePreview,
  fetchOnsiteTriggers,
  submitOnsiteLead,
  recordOnsiteEvent,
  type OnsiteContext,
} from "@/features/onsite/api/onsite.service";
import { OnsiteMessageView } from "@/features/onsite/components/OnsiteMessageView";
import { watchOnsiteTriggers } from "@/features/onsite/lib/watchTriggers";
import { ASSISTANT_LINK, ASSISTANT_OPEN_EVENT, type OnsiteMessage } from "@/features/onsite/types";
import { getSessionId, getVisitorId } from "@/lib/analytics/tracker";
import { env } from "@/lib/config/env";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";

/** `?onsite_preview=<token>`: an admin testing a campaign from the playground. */
const PREVIEW_PARAM = "onsite_preview";

function previewTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
  return token && token.length <= 300 ? token : null;
}

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
  // Popups and banners are personalised marketing and need a stored visitor id for their
  // frequency limits, so they appear only after the shopper allowed marketing.
  const marketing = useConsentFor("marketing");
  const contextRef = useRef<OnsiteContext | null>(null);
  // Read when an idle nudge asks for a bag with items; kept in a ref so the timers never restart.
  const cartItems = useCartStore((state) => state.itemCount());
  const cartItemsRef = useRef(0);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);
  const showing = useRef(false);
  // An admin preview shows that one saved campaign straight away, whatever its status, rules or the
  // cookie choice (it is the admin's own test). Nothing is recorded and normal rules are not asked.

  useEffect(() => {
    const token = previewTokenFromUrl();
    if (!token) return;
    let cancelled = false;
    const path = window.location.pathname;
    void fetchOnsitePreview({ path, locale: localeFromPathname(path), zoneCode }, token)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          console.warn("[onsite] The preview link is invalid or has expired. Open a fresh one from the admin.");
          return;
        }
        showing.current = true;
        setMessage(found);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname, zoneCode]);

  useEffect(() => {
    if (!env.onsite.enabled || !marketing || previewTokenFromUrl()) return;
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
            type: trigger.type,
            seconds: trigger.type === "dwell" || trigger.type === "idle" ? observed.seconds : undefined,
            scrollPercent: trigger.type === "scroll" ? observed.scrollPercent : undefined,
            cartItems: trigger.type === "idle" ? observed.cartItems : undefined,
          })
            .then((decided) => {
              if (cancelled || !decided || showing.current) return;
              showing.current = true;
              setMessage(decided);
              void recordOnsiteEvent(context, decided.ruleId, "SHOWN").catch(() => undefined);
            })
            .catch(() => undefined);
        }, () => cartItemsRef.current);
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
  }, [pathname, zoneCode, marketing]);

  const report = useCallback((type: "CLICKED" | "DISMISSED", ruleId: string) => {
    if (previewTokenFromUrl()) return;
    const context = contextRef.current;
    if (context) void recordOnsiteEvent(context, ruleId, type).catch(() => undefined);
  }, []);

  // A button whose link is `assistant:open` opens the chat instead of leaving the page.
  useEffect(() => {
    if (!message) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[data-onsite-cta]");
      if (!link || link.getAttribute("href") !== ASSISTANT_LINK) return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT));
      setMessage(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [message]);

  if (!message) return null;
  return (
    <OnsiteMessageView
      message={message}
      onDismiss={() => {
        report("DISMISSED", message.ruleId);
        setMessage(null);
      }}
      onCta={() => report("CLICKED", message.ruleId)}
      onLead={(payload) => {
        const path = window.location.pathname;
        const context = contextRef.current ?? {
          path,
          locale: localeFromPathname(path),
          zoneCode,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
        };
        return submitOnsiteLead(context, message.ruleId, payload, previewTokenFromUrl());
      }}
    />
  );
}
