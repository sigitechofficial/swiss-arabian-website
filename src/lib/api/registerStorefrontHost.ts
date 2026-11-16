import { headers } from "next/headers";
import {
  isLoopbackHost,
  setServerStorefrontHostResolver,
  storefrontHostFromHeaderValues,
} from "./storefrontHost";
import { currentSiteHost } from "@/lib/site/currentSite";
import { verifiedRequestSiteHost } from "@/lib/site/requestSiteHost";

/**
 * Server API calls send the website address being rendered: the `[site]` root
 * param (one deployment serves every market website of the brand, each with its
 * own cached pages), so `ksa.swissarabian.com` gets the KSA market from the
 * backend. Local `*.localhost` aliases are mapped to their shop host by
 * resolveStorefrontHost.
 *
 * Outside the site tree (the 404 page for an address no route matches, e.g. a
 * missing file): `next dev` uses the request's address; deployed websites use it
 * only once it is verified as one of this brand's websites (SE-10: these calls
 * reached the backend with no shop and were refused).
 */
setServerStorefrontHostResolver(async () => {
  const site = await currentSiteHost();
  if (site) return isLoopbackHost(site) ? site : site.replace(/:\d+$/, "");
  let incoming: Headers;
  try {
    incoming = await headers();
  } catch {
    return null;
  }
  if (process.env.NODE_ENV === "production") return verifiedRequestSiteHost(incoming);
  return storefrontHostFromHeaderValues(incoming.get("x-forwarded-host"), incoming.get("host"));
});
