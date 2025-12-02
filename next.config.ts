import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the output file tracing root to the project directory
  // This prevents Next.js from being confused by lockfiles in parent directories
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phantom.app",
      },
      {
        protocol: "https",
        hostname: "solflare.com",
      },
      {
        protocol: "https",
        hostname: "www.backpack.app",
      },
      {
        protocol: "https",
        hostname: "jup.ag",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;


