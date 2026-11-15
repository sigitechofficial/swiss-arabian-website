"use client";

import { useSyncExternalStore } from "react";
import { consentBannerNeeded, openConsentSettings } from "@/lib/consent/consent";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";

const noop = () => () => undefined;

/**
 * "Cookie settings" in the footer: reopens the cookie banner's choices so a shopper can change
 * their mind at any time. Hidden when the address uses nothing optional (no banner either).
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  const copy = useShopCopy();
  const integrations = useSiteIntegrations();
  const needed = useSyncExternalStore(noop, () => consentBannerNeeded(integrations), () => false);
  if (!needed) return null;
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className={`cursor-pointer underline underline-offset-2 ${className ?? ""}`}
      data-cookie-settings
    >
      {copy("footer.cookieSettings")}
    </button>
  );
}
