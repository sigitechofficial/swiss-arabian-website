import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
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
