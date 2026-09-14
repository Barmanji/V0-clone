import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: produces a self-contained .next/standalone folder so the
  // app can run in a minimal Node container (see Dockerfile). Only powers
  // `next build`; local `pnpm run dev` is unaffected.
};

export default nextConfig;
