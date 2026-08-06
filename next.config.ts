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

const nextConfig: NextConfig = {
  output: "standalone",
  // Next 16 blocks cross-origin /_next/* from non-localhost unless allowlisted
  allowedDevOrigins: lanDevOrigins(),
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
    ],
  },
};

export default nextConfig;
