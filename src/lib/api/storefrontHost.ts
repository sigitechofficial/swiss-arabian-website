/**
 * Storefront identity sent as `x-storefront-host`.
 * The backend resolves Brand from this host. Never substitute a default domain.
 */

import { localStorefrontHost } from "@/lib/config/runtime";
import { localStorefrontForHost } from "@/lib/storefront/localStorefront";

/** First value when a proxy sends a comma-separated forwarded-host list. */
export function storefrontHostFromHeaderValues(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
): string | null {
  const forwarded = firstHostToken(forwardedHost);
  if (forwarded) return forwarded;
  return firstHostToken(host);
}

export function browserStorefrontHost(): string | null {
  if (typeof window === "undefined") return null;
  return firstHostToken(window.location.host);
}

function firstHostToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const token = value.split(",")[0]?.trim() ?? "";
  return token.length > 0 ? token : null;
}

export function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/:\d+$/, "");
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

/**
 * Local only: the shop host a local address stands for — the `*.localhost`
 * alias's shop (`sp.localhost` → sapil.test), else STOREFRONT_HOST. Deployed
 * websites always know the shopper's address.
 */
export function configuredStorefrontHost(liveHost?: string | null): string | null {
  const local = localStorefrontForHost(liveHost);
  if (local) return local.host;
  return localStorefrontHost() || null;
}

type ServerHostResolver = () => Promise<string | null>;

const SERVER_HOST_RESOLVER = Symbol.for("swissarabian.serverStorefrontHostResolver");

type HostResolverGlobal = typeof globalThis & {
  [SERVER_HOST_RESOLVER]?: ServerHostResolver;
};

/**
 * Instrumentation and the page bundle are separate copies of this module.
 * A module variable set at startup is invisible to the request, so the
 * product page calls the API with no storefront host.
 */
export function setServerStorefrontHostResolver(resolver: ServerHostResolver): void {
  (globalThis as HostResolverGlobal)[SERVER_HOST_RESOLVER] = resolver;
}

export async function readRegisteredServerHost(): Promise<string | null> {
  const resolver = (globalThis as HostResolverGlobal)[SERVER_HOST_RESOLVER];
  if (!resolver) return null;
  return resolver();
}

export async function resolveStorefrontHost(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const live = browserStorefrontHost();
    if (live && !isLoopbackHost(live)) return live;
    // localhost is not a registered storefront. Sending it makes markets 400
    // and the product page renders as unavailable.
    return configuredStorefrontHost(live);
  }
  const server = await readRegisteredServerHost();
  if (server && !isLoopbackHost(server)) return server;
  return configuredStorefrontHost(server);
}
