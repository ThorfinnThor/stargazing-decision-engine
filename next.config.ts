import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // V1 is a static product: Cloudflare serves build artifacts and committed JSON.
  // Any future feature that needs a runtime must first remove this explicit guard.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
