/**
 * Storefront identity sent as `x-storefront-host`.
 * The backend resolves Brand from this host. Never substitute a default domain.
 */

import { env } from "@/lib/config/env";

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

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/:\d+$/, "");
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

/** Env override for local Sapil (`NEXT_PUBLIC_STOREFRONT_HOST`). */
function configuredStorefrontHost(): string | null {
  const raw = env.storefrontHost?.trim();
  if (!raw) return null;
  return (
    raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "") || null
  );
}

type ServerHostResolver = () => Promise<string | null>;

let serverHostResolver: ServerHostResolver | null = null;

/** Called once from the Node server runtime. Not imported by client components. */
export function setServerStorefrontHostResolver(resolver: ServerHostResolver): void {
  serverHostResolver = resolver;
}

export async function readRegisteredServerHost(): Promise<string | null> {
  if (!serverHostResolver) return null;
  return serverHostResolver();
}

export async function resolveStorefrontHost(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const live = browserStorefrontHost();
    if (live && !isLoopbackHost(live)) return live;
    return configuredStorefrontHost() ?? live;
  }
  const server = await readRegisteredServerHost();
  if (server && !isLoopbackHost(server)) return server;
  return configuredStorefrontHost() ?? server;
}
