import { getBrandConfig } from "@/lib/brand";
import { redirectHost } from "@/lib/seo/storedRedirects";
import { lookupSite } from "./siteRegistry";

/**
 * The website address a request came to, for server code outside the page tree
 * (the 404 for an address no route matches). Same rule as the proxy: an address
 * in the backend's address table that belongs to this deployment's brand.
 * Anything else (an unknown or forged Host, the backend unreachable) is null,
 * so another brand's settings never render in this brand's pages.
 */
export async function verifiedRequestSiteHost(incoming: Headers): Promise<string | null> {
  const host = redirectHost(incoming);
  if (!host) return null;
  const lookup = await lookupSite(host);
  if (lookup.status !== "known") return null;
  if (lookup.site.brandCode.trim().toUpperCase() !== getBrandConfig(host).code) return null;
  return host;
}
