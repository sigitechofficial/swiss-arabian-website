"use client";

import { useSyncExternalStore } from "react";
import { consentSettingsOffered, openConsentSettings } from "@/lib/consent/consent";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useSiteIntegrations } from "@/lib/site/SiteIntegrationsProvider";

const noop = () => () => undefined;

/**
 * "Cookie settings" in the footer: reopens the cookie banner's choices so a shopper can change
 * their mind at any time, also where the market shows no banner (consent not required: a shopper can
 * still refuse here). Hidden when the address uses nothing optional.
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  const copy = useShopCopy();
  const integrations = useSiteIntegrations();
  const needed = useSyncExternalStore(noop, () => consentSettingsOffered(integrations), () => false);
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
