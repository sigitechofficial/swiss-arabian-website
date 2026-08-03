import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Azure Container Apps production image (standalone Node server).
  output: "standalone",
};

export default nextConfig;
