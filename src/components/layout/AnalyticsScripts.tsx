import Script from "next/script";
import type { SiteIntegrations } from "@/lib/site/siteIntegrations.types";

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
 * Loads only when GA4 / GTM is on for the address's market on the integrations
 * switchboard (ADR-005 phase E): a brand may share one container across its market
 * websites or give a market its own. The page first tells it which website, market,
 * country, currency and language it is (dataLayer, or GA4 page fields), so one
 * shared container can still send each market to its own GA4 property.
 * GA4 records page changes in this single-page app through its history tracking.
 */
export function AnalyticsScripts({
  ids,
  context,
}: {
  ids: SiteIntegrations["analytics"];
  context?: AnalyticsSiteContext;
}) {
  const gtmId = ids?.gtmContainerId ?? null;
  const ga4Id = ids?.ga4MeasurementId ?? null;
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
