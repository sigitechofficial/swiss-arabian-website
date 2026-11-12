import { headers } from "next/headers";
import {
  setServerStorefrontHostResolver,
  storefrontHostFromHeaderValues,
} from "./storefrontHost";

/**
 * Server API calls send the storefront host. Production builds use the
 * configured host (NEXT_PUBLIC_STOREFRONT_HOST, one deployment per brand)
 * and never read the request, so catalog pages can be prerendered. In
 * development the request's host is used (local `*.localhost` brand aliases).
 */
setServerStorefrontHostResolver(async () => {
  if (process.env.NODE_ENV === "production") return null;
  const incoming = await headers();
  return storefrontHostFromHeaderValues(
    incoming.get("x-forwarded-host"),
    incoming.get("host"),
  );
});
