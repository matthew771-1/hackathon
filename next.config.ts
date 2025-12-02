import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the output file tracing root to the project directory
  // This prevents Next.js from being confused by lockfiles in parent directories
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;


