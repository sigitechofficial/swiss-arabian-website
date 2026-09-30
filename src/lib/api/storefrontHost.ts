/**
 * Storefront identity sent as `x-storefront-host`.
 * The backend resolves Brand from this host. Never substitute a default domain.
 */

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
  if (typeof window !== "undefined") return browserStorefrontHost();
  return readRegisteredServerHost();
}
