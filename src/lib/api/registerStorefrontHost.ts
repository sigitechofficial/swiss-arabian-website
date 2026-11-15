import { headers } from "next/headers";
import {
  isLoopbackHost,
  setServerStorefrontHostResolver,
  storefrontHostFromHeaderValues,
} from "./storefrontHost";
import { currentSiteHost } from "@/lib/site/currentSite";

/**
 * Server API calls send the website address being rendered: the `[site]` root
 * param (one deployment serves every market website of the brand, each with its
 * own cached pages), so `ksa.swissarabian.com` gets the KSA market from the
 * backend. Local `*.localhost` aliases are mapped to their shop host by
 * resolveStorefrontHost. Outside the site tree, production falls back to the
 * configured host; `next dev` uses the request's address.
 */
setServerStorefrontHostResolver(async () => {
  const site = await currentSiteHost();
  if (site) return isLoopbackHost(site) ? site : site.replace(/:\d+$/, "");
  if (process.env.NODE_ENV === "production") return null;
  try {
    const incoming = await headers();
    return storefrontHostFromHeaderValues(
      incoming.get("x-forwarded-host"),
      incoming.get("host"),
    );
  } catch {
    return null;
  }
});
