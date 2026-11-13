"use client";

import { useState, useSyncExternalStore } from "react";
import { getTrackingConsent, setTrackingConsent } from "@/lib/analytics/tracker";
import { env } from "@/lib/config/env";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/**
 * Asks once whether we may measure how the shop is used. Accept or Decline is remembered in this
 * browser and read by the tracker: Decline stops every first-party event from being queued or sent.
 * Shown only when tracking is switched on and the shopper has not chosen yet.
 *
 * The server snapshot is "hidden", so the server-rendered page and the first client render always
 * match; the real answer is read from this browser right after.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const needsChoice = () => env.tracking.enabled && getTrackingConsent() === "UNKNOWN";

export function ConsentBanner() {
  const copy = useShopCopy();
  const undecided = useSyncExternalStore(subscribe, needsChoice, () => false);
  const [answered, setAnswered] = useState(false);

  if (!undecided || answered) return null;

  const choose = (value: "granted" | "denied") => {
    setTrackingConsent(value);
    setAnswered(true);
  };

  return (
    <section
      role="region"
      aria-label={copy("consentTitle")}
      data-consent-banner
      // Above the on-site banner (z-210) and popup backdrop (z-220): this choice comes first.
      className="fixed inset-x-0 bottom-0 z-[230] flex flex-col gap-3 border-t border-black/10 bg-page px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-sa-primary shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="m-0 max-w-3xl">
        <strong className="font-medium">{copy("consentTitle")}</strong>{" "}
        <span className="opacity-80">{copy("consentBody")}</span>{" "}
        <LocaleLink href="/privacy-policy" className="underline">
          {copy("consentLearnMore")}
        </LocaleLink>
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="cursor-pointer rounded-full border border-black/20 px-5 py-2.5 font-medium"
        >
          {copy("consentDecline")}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="cursor-pointer rounded-full bg-terra px-5 py-2.5 font-medium text-white"
        >
          {copy("consentAccept")}
        </button>
      </div>
    </section>
  );
}
