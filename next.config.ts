import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  // Document URLs used by the original portal live outside /investor; keep both working.
  async rewrites() {
    return [
      { source: "/documents/investments/:id", destination: "/investor/documents/investments/:id" },
      { source: "/documents/signatures/:id", destination: "/investor/documents/signatures/:id" },
      { source: "/opportunities/:id/invest", destination: "/investor/opportunities/:id/invest" },
    ];
  },
  // NOTE: the "/" redirect lives in src/proxy.ts (session-aware: anonymous -> login,
  // signed-in -> investments). A static redirect here would run BEFORE the proxy and
  // force anonymous visitors through a second bounce via /investor/investments.
};
export default config;
