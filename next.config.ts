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
  {
    protocol: "https" as const,
    hostname:
      "ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io",
    pathname: "/catalog/media/**",
  },
].filter(Boolean) as RemotePattern[];

const nextConfig: NextConfig = {
  // Next.js 16.3 fails to emit `.next/next-server.js.nft.json` when
  // `output: "standalone"` is combined with Vercel's build adapter, which
  // breaks Vercel's `onBuildComplete` step with an ENOENT on that file
  // (https://github.com/vercel/next.js/issues/96646). Standalone is only
  // needed for self-hosted/Docker builds, so skip it on Vercel — Vercel
  // already produces its own optimized deployment output.
  output: process.env.VERCEL ? undefined : "standalone",
  allowedDevOrigins: lanDevOrigins(),
  // Stripe Elements renders in a js.stripe.com iframe and fetches our brand
  // font cross-origin, which browsers only allow with a CORS header.
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
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
      {
        protocol: "https",
        hostname: "dossier.eu",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "swissarabian.com",
        pathname: "/cdn/shop/files/**",
      },
      ...catalogMediaPatterns,
    ],
  },
};

export default nextConfig;
