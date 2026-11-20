/**
 * What a website address may load: analytics, Insider's website tag, pay-later
 * promos and Google Maps — from the backend's switchboard for the market the
 * address shows (`GET /storefront/site/integrations`, ADR-005 phase E). Nothing
 * here is a build setting: switching an integration off in the admin removes it
 * from the website.
 */
export type SiteIntegrations = {
  /** The market these settings follow; null when the backend could not say (all off). */
  marketCode: string | null;
  /** Tag Manager (preferred) or GA4. */
  analytics: { gtmContainerId: string | null; ga4MeasurementId: string | null } | null;
  insiderTag: { accountId: string; scriptHost: string } | null;
  /** Only providers the market's checkout offers now; the ids are optional. */
  paymentPromos: {
    tabby: { merchantCode: string | null; publicKey: string | null } | null;
    /** `publicKey`: Tamara widget v2 key (browser-safe); null → plain pay-in-4 wording instead of the widget. */
    tamara: { merchantCode: string | null; publicKey: string | null } | null;
  };
  googleMaps: { browserKey: string; mapId: string | null } | null;
  /** Social sign-in on for the market: the website's client id per provider (ADR-005 phase G). */
  signIn: {
    google: { clientId: string } | null;
    apple: { clientId: string } | null;
  };
  /**
   * Customer email verification is on in the backend: sign-up asks for the
   * emailed code, code sign-in is offered, an unverified email sign-in goes to
   * the code screen. The backend is the only source (no build setting).
   */
  accountVerification: boolean;
};

/** Everything off: no answer from the backend never means "use some default". */
export const SITE_INTEGRATIONS_OFF: SiteIntegrations = {
  marketCode: null,
  analytics: null,
  insiderTag: null,
  paymentPromos: { tabby: null, tamara: null },
  googleMaps: null,
  signIn: { google: null, apple: null },
  accountVerification: false,
};

/** Cache tag of an address's settings; the backend's refresh call names the address. */
export function siteIntegrationsTag(storefrontHost: string): string {
  return `site-integrations:${storefrontHost.toLowerCase()}`;
}
