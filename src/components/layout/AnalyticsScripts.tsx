import Script from "next/script";
import { brandIntegrations } from "@/lib/brand";

/**
 * Google Tag Manager (preferred: GA4 and other tags are managed there) or GA4 directly.
 * Loads only when an ID is configured (NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA4_ID).
 * GA4 records page changes in this single-page app through its history tracking.
 */
export function AnalyticsScripts() {
  const { gtmId, ga4Id } = brandIntegrations().analytics;
  if (gtmId) {
    return (
      <>
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    );
  }
  if (ga4Id) {
    return (
      <>
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
  return null;
}
