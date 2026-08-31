import type { NextConfig } from "next";
import os from "node:os";

/** LAN / Tailscale IPv4s so `http://192.168.x.x:3000` works in `next dev`. */
function lanDevOrigins(): string[] {
  const hosts = new Set<string>();
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        hosts.add(addr.address);
      }
    }
  }
  return [...hosts];
}

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
};

function remotePatternFromBaseUrl(
  baseUrl: string | undefined,
  pathname: string,
): RemotePattern | null {
  const raw = baseUrl?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname,
    };
  } catch {
    return null;
  }
}

const catalogMediaPatterns = [
  remotePatternFromBaseUrl(
    process.env.NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL,
    "/catalog/media/**",
  ),
  remotePatternFromBaseUrl(
    process.env.NEXT_PUBLIC_DEV_API_BASE_URL,
    "/catalog/media/**",
  ),
  remotePatternFromBaseUrl(
    process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL,
    "/catalog/media/**",
  ),
  remotePatternFromBaseUrl(
    process.env.NEXT_PUBLIC_STAGING_API_BASE_URL,
    "/catalog/media/**",
  ),
  remotePatternFromBaseUrl(
    process.env.NEXT_PUBLIC_PRODUCTION_API_BASE_URL,
    "/catalog/media/**",
  ),
  // Azure Dev default when env not loaded at config time
  {
    protocol: "https" as const,
    hostname:
      "ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
    pathname: "/catalog/media/**",
  },
  // All LAN IPs on this machine — covers any 192.168.x.x backend in dev
  ...lanDevOrigins().map((ip) => ({
    protocol: "http" as const,
    hostname: ip,
    port: "3000",
    pathname: "/catalog/media/**",
  })),
  // Any host on port 3000 in local dev (backend may return its own LAN IP in image URLs)
  ...(process.env.NODE_ENV === "development"
    ? [{ protocol: "http" as const, hostname: "**", port: "3000", pathname: "/catalog/media/**" }]
    : []),
].filter(Boolean) as RemotePattern[];

const nextConfig: NextConfig = {
  output: "standalone",
  // Next 16 blocks cross-origin /_next/* from non-localhost unless allowlisted.
  // uae.swissarabian.com is the Insider partner host — local hosts-file testing.
  allowedDevOrigins: [...lanDevOrigins(), "uae.swissarabian.com"],
  images: {
    qualities: [75, 90, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "stswissarabiandev.blob.core.windows.net",
        pathname: "/catalog-images/**",
      },
      ...catalogMediaPatterns,
    ],
  },
};

export default nextConfig;
