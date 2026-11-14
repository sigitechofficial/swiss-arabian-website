"use client";

import Script from "next/script";
import { useEffect } from "react";
import { brandIntegrations } from "@/lib/brand";
import { useConsent } from "@/lib/consent/useConsent";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type ConsentState = "granted" | "denied";

/** Google consent mode v2 values from the cookie banner choice. */
function googleConsent(analytics: boolean, marketing: boolean): Record<string, ConsentState> {
  const ads: ConsentState = marketing ? "granted" : "denied";
  return {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

/**
 * Google Tag Manager (preferred: GA4 and other tags are managed there) or GA4 directly.
 * Loads only when an ID is configured (NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA4_ID) **and** the shopper
 * allowed analytics in the cookie banner. Google consent mode is set before the tag loads and
 * updated when the choice changes, so advertising tags inside GTM follow the marketing choice.
 * GA4 records page changes in this single-page app through its history tracking.
 */
export function AnalyticsScripts() {
  const { gtmId, ga4Id } = brandIntegrations().analytics;
  const consent = useConsent();
  const analytics = consent?.analytics === true;
  const marketing = consent?.marketing === true;

  // A later change (for example marketing switched on in Cookie settings) reaches loaded tags.
  useEffect(() => {
    if (!analytics || typeof window === "undefined" || !window.dataLayer) return;
    // gtag commands must be pushed as an `arguments` object, not an array.
    const layer = window.dataLayer;
    const gtag = function (..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
    gtag("consent", "update", googleConsent(analytics, marketing));
  }, [analytics, marketing]);

  if (!analytics || (!gtmId && !ga4Id)) return null;

  const consentDefault = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',${JSON.stringify(googleConsent(true, marketing))});`;

  if (gtmId) {
    return (
      <>
        <Script id="gtm-consent" strategy="afterInteractive">
          {consentDefault}
        </Script>
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      </>
    );
  }
  return (
    <>
      <Script id="ga4-consent" strategy="afterInteractive">
        {consentDefault}
      </Script>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
      </Script>
    </>
  );
}
