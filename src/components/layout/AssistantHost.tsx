"use client";
import { useLocaleConfig } from "@/lib/i18n/ShopLocaleProvider";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchAssistantEnabled } from "@/features/assistant/api/assistant.service";
import { AssistantWidget } from "@/features/assistant/components/AssistantWidget";
import { getAccessToken } from "@/lib/auth/token";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";

/**
 * Pages where a chat window would get in the way: paying, and the sign-in, sign-up, one-time-code and
 * password pages, where it would cover the form and a customer is in the middle of proving who they are.
 */
const HIDDEN_ON =
  /\/(checkout|payment|login|register|signup|sign-up|verify|otp|forgot-password|reset-password)(\/|$)/;

/**
 * Shows the shopping assistant window when the backend has switched it on for this brand and market
 * (admin: Settings → Shopping assistant; no website build setting). The
 * window is opened by the shopper, so nothing is sent before they write. A guest's chat is not saved
 * anywhere and nothing identifies them; a signed-in customer's chat is saved and comes back.
 */
export function AssistantHost() {
  const pathname = usePathname() || "/";
  const localeConfig = useLocaleConfig();
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const [enabled, setEnabled] = useState(false);

  // Whose chat this is. When the customer signs out, signs in, or another tab does either, the window is
  // started again from nothing: the earlier messages, an open request and the loaded history belong to the
  // person who was signed in, and must never be left on screen for the next one.
  const customerKey = useAuthStore((state) => (state.bootstrapped ? (state.user?.id ?? "guest") : "pending"));
  const [otherTab, setOtherTab] = useState(0);
  const hadToken = useRef<boolean | null>(null);
  useEffect(() => {
    hadToken.current = Boolean(getAccessToken());
    const onStorage = () => {
      const has = Boolean(getAccessToken());
      if (hadToken.current !== has) {
        hadToken.current = has;
        setOtherTab((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!zoneCode) return;
    let cancelled = false;
    void fetchAssistantEnabled(zoneCode).then((value) => {
      if (!cancelled) setEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, [zoneCode]);

  if (!enabled || !zoneCode || HIDDEN_ON.test(pathname)) return null;
  return (
    <AssistantWidget
      key={`${customerKey}:${otherTab}`}
      zoneCode={zoneCode}
      locale={localeFromPathname(pathname, localeConfig)}
    />
  );
}
