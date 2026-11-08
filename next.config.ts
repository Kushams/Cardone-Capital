import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // The portal is served behind the cardone-domain-proxy relay Worker, so
      // browsers post actions from the public domain while the app Worker sees
      // its own workers.dev host. Without these entries Next rejects every
      // relayed Server Action ("Invalid Server Actions request").
      allowedOrigins: [
        "investors.cardonecapitalportal.us",
        "investor.cardonecapitalportal.us",
        "cardone-domain-proxy.worldbridgemeridian.workers.dev",
      ],
    },
  },
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
