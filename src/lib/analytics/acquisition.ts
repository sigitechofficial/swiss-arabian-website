import { withoutMarketSegment } from "@/lib/site/marketLink";

/**
 * Where a visit came from (campaign tags, ad click, referring site), read once from the address the
 * shopper landed on. Sent by the tracker with the first event after landing (behavior_event_v1
 * `acquisition`); the backend normalises it (channel_grouping_v1: a Meta or TikTok click is paid
 * social, a Google click paid search, a search engine referrer organic search...) and the session takes
 * it from its first event, so traffic-source reports credit the campaign instead of "Direct".
 *
 * Privacy:
 * - Ad click ids (gclid, fbclid, msclkid, ttclid) are never sent: only that one was present ("1"),
 *   which is all the backend keeps.
 * - The referrer is reduced to its host, and only another site's host (our own pages are not a source).
 * - The landing path is the path only, without the query string, like every page path the tracker sends.
 * - Nothing here is stored: it lives in memory for the page and leaves only with an event, so only once
 *   the shopper allowed analytics.
 */
export type AcquisitionContext = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPath: string;
  referrerHost?: string;
  gclid?: "1";
  fbclid?: "1";
  msclkid?: "1";
  ttclid?: "1";
};

const UTM_FIELDS = [
  ["utm_source", "source"],
  ["utm_medium", "medium"],
  ["utm_campaign", "campaign"],
  ["utm_content", "content"],
  ["utm_term", "term"],
] as const;

const CLICK_IDS = ["gclid", "fbclid", "msclkid", "ttclid"] as const;

/** Same limit as every tracker property: a longer value is dropped, never cut into something else. */
const MAX_VALUE = 200;

function tag(params: URLSearchParams, name: string): string | undefined {
  const value = params.get(name)?.trim();
  return value && value.length <= MAX_VALUE ? value : undefined;
}

function externalReferrerHost(referrer: string, ownHost: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const host = url.host.toLowerCase();
    return host && host !== ownHost.toLowerCase() ? host : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The visit's acquisition from a landing address, or null when it has none (typed address, bookmark,
 * a link from our own pages): such a visit is Direct, and sending nothing says exactly that.
 */
export function readAcquisition(
  location: Pick<Location, "search" | "pathname" | "host">,
  referrer: string,
): AcquisitionContext | null {
  const params = new URLSearchParams(location.search);
  const context: AcquisitionContext = { landingPath: withoutMarketSegment(location.pathname) };
  let found = false;
  for (const [param, field] of UTM_FIELDS) {
    const value = tag(params, param);
    if (value) {
      context[field] = value;
      found = true;
    }
  }
  for (const id of CLICK_IDS) {
    if (params.get(id)?.trim()) {
      context[id] = "1";
      found = true;
    }
  }
  const referrerHost = externalReferrerHost(referrer, location.host);
  if (referrerHost) {
    context.referrerHost = referrerHost;
    found = true;
  }
  return found ? context : null;
}
