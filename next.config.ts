import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import os from "node:os";
import { REMOTE_IMAGE_PATTERNS } from "./src/lib/images/remoteImagePatterns";
import { brandForCode, DEFAULT_BRAND_CODE } from "./src/lib/brand/registry";

/**
 * The brand's UI (`@brand-ui`) is chosen at build time: one deployment per brand,
 * so each bundle holds only its own design system. See src/brands/README.md.
 */
const BRAND_UI_THEME =
  brandForCode(process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE ?? DEFAULT_BRAND_CODE)?.themeKey ??
  "swiss-arabian";

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

/**
 * Dev-only reference routes (`src/app/[locale]/(dev)/**\/page.dev.tsx`: the
 * Sapil kit / preview for the visual diff) are routes only in `next dev`, in a
 * Sapil build, or with SAPIL_KIT=1. A Swiss Arabian build has no such route,
 * so it ships none of the Sapil kit code.
 */
function devRouteExtensions(phase: string): string[] {
  const on =
    phase === PHASE_DEVELOPMENT_SERVER ||
    BRAND_UI_THEME === "sapil" ||
    process.env.SAPIL_KIT === "1";
  return on ? ["dev.tsx"] : [];
}

const nextConfig = (phase: string): NextConfig => ({
  pageExtensions: ["tsx", "ts", "jsx", "js", ...devRouteExtensions(phase)],
  // Git worktrees share the main checkout's node_modules through a junction, which
  // Turbopack rejects unless its root covers it. Opt-in only (unset in CI and deploys).
  turbopack: {
    ...(process.env.TURBOPACK_ROOT ? { root: process.env.TURBOPACK_ROOT } : {}),
    resolveAlias: {
      "@brand-ui/client": `./src/brands/${BRAND_UI_THEME}/brand-ui.client.ts`,
      "@brand-ui": `./src/brands/${BRAND_UI_THEME}/brand-ui.ts`,
    },
  },
  // Next.js 16.3 fails to emit `.next/next-server.js.nft.json` when
  // `output: "standalone"` is combined with Vercel's build adapter, which
  // breaks Vercel's `onBuildComplete` step with an ENOENT on that file
  // (https://github.com/vercel/next.js/issues/96646). Standalone is only
  // needed for self-hosted/Docker builds, so skip it on Vercel — Vercel
  // already produces its own optimized deployment output.
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: { globalNotFound: true },
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
});

export default nextConfig;
