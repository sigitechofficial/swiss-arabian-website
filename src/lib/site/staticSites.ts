import { fetchStorefrontMarkets } from "@/features/markets/api/markets.service";
import { configuredStorefrontHost } from "@/lib/api/storefrontHost";
import { normalizeSiteHost, siteKeyFromHost } from "./siteKey";

/**
 * Website addresses prerendered at build time: the deployment's configured
 * address plus every market website of the brand (backend address table).
 * Any other known address is rendered on its first visit and cached (ISR), so a
 * new market website needs no rebuild. Unknown addresses never get here (the
 * proxy answers 404).
 */
export async function staticSiteKeys(): Promise<string[]> {
  const hosts = new Set<string>();
  const configured = normalizeSiteHost(configuredStorefrontHost(null));
  if (configured) hosts.add(configured);
  try {
    const { markets } = await fetchStorefrontMarkets();
    for (const market of markets) {
      if (!market.storefrontUrl) continue;
      const host = normalizeSiteHost(new URL(market.storefrontUrl).host);
      if (host) hosts.add(host);
    }
  } catch {
    // Backend not reachable at build: these addresses render on first visit.
  }
  return [...hosts].map(siteKeyFromHost);
}
