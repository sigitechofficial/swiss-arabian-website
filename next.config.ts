import type { NextConfig } from "next";
import os from "node:os";
import { REMOTE_IMAGE_PATTERNS } from "./src/lib/images/remoteImagePatterns";

/** LAN / Tailscale IPv4s so `http://192.168.x.x:3004` works in `next dev`. */
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

const nextConfig: NextConfig = {
  // Git worktrees share the main checkout's node_modules through a junction, which
  // Turbopack rejects unless its root covers it. Opt-in only (unset in CI and deploys).
  ...(process.env.TURBOPACK_ROOT ? { turbopack: { root: process.env.TURBOPACK_ROOT } } : {}),
  // Next.js 16.3 fails to emit `.next/next-server.js.nft.json` when
  // `output: "standalone"` is combined with Vercel's build adapter, which
  // breaks Vercel's `onBuildComplete` step with an ENOENT on that file
  // (https://github.com/vercel/next.js/issues/96646). Standalone is only
  // needed for self-hosted/Docker builds, so skip it on Vercel — Vercel
  // already produces its own optimized deployment output.
  output: process.env.VERCEL ? undefined : "standalone",
  allowedDevOrigins: [
    ...lanDevOrigins(),
    "127.0.0.1",
    "localhost",
    // Local brand aliases: sp.localhost (Sapil), sa.localhost (Swiss Arabian).
    "*.localhost",
    "uae.swissarabian.com",
    "barbra-beneficent-jannette.ngrok-free.dev",
    "unprolifically-unsuggestible-zackary.ngrok-free.dev",
  ],
  async rewrites() {
    // Same-origin /storefront on the ngrok HTTPS URL. The browser must not call
    // http://localhost:3000 from an HTTPS page (Chrome blocks that as mixed content).
    return [
      {
        source: "/storefront/:path*",
        destination: "http://127.0.0.1:3000/storefront/:path*",
      },
      {
        source: "/catalog/:path*",
        destination: "http://127.0.0.1:3000/catalog/:path*",
      },
      {
        source: "/webhooks/:path*",
        destination: "http://127.0.0.1:3000/webhooks/:path*",
      },
    ];
  },
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
    // Shared with <MediaImage>, which serves other hosts unoptimized.
    remotePatterns: REMOTE_IMAGE_PATTERNS,
  },
};

export default nextConfig;
