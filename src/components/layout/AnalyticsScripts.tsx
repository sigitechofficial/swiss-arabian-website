import Script from "next/script";
import { brandIntegrations } from "@/lib/brand";

/** The website a page belongs to: lets one tag setup per brand tell markets apart. */
export type AnalyticsSiteContext = {
  /** Website address, e.g. `ksa.swissarabian.com`. */
  siteHost: string | null;
  /** Market code, e.g. `KSA`. */
  market: string | null;
  /** ISO country, e.g. `SA`. */
  country: string | null;
  /** ISO currency, e.g. `SAR`. */
  currency: string | null;
  /** Page language, e.g. `ar`. */
  language: string | null;
};

/** Characters that could end the script tag or the line inside an inline script. */
const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, "g");

/** JSON safe inside an inline script (no `</script>` break-out). */
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(
    UNSAFE_IN_SCRIPT,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

/** dataLayer / GA4 fields for the site context (empty values left out). */
export function analyticsSiteFields(context: AnalyticsSiteContext | undefined) {
  if (!context) return {};
  const fields: Record<string, string> = {};
  if (context.siteHost) fields.site_host = context.siteHost;
  if (context.market) fields.market = context.market;
  if (context.country) fields.market_country = context.country;
  if (context.currency) fields.currency = context.currency;
  if (context.language) fields.site_language = context.language;
  return fields;
}

/**
 * Google Tag Manager (preferred: GA4 and other tags are managed there) or GA4 directly.
 * Loads only when an ID is configured (NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA4_ID), one
 * per brand. Every market website of the brand shares it: the page first tells it
 * which website, market, country, currency and language it is (dataLayer, or GA4
 * page fields), so GTM can send each market to its own GA4 property or report by
 * market, and a new market website needs no new tag setup.
 * GA4 records page changes in this single-page app through its history tracking.
 */
export function AnalyticsScripts({ context }: { context?: AnalyticsSiteContext } = {}) {
  const { gtmId, ga4Id } = brandIntegrations().analytics;
  const fields = analyticsSiteFields(context);
  const hasFields = Object.keys(fields).length > 0;
  if (gtmId) {
    return (
      <>
        <Script id="gtm-init" strategy="afterInteractive">
          {`${hasFields ? `window.dataLayer=window.dataLayer||[];window.dataLayer.push(${inlineJson(fields)});` : ""}(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
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
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}'${hasFields ? `,${inlineJson(fields)}` : ""});`}
        </Script>
      </>
    );
  }
  return null;
}
