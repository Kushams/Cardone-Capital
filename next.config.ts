import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // Security + privacy headers on every response (audit follow-up items 2-3).
  // This is a private, login-only investor portal: it must never be indexed,
  // framed, or sniffed. The CSP is deliberately conservative: the app is
  // same-origin, Next inlines its bootstrap scripts and the portal uses inline
  // styles throughout (hence 'unsafe-inline' for script/style), and the only
  // framed third-party content is the Google Maps embed on offering pages.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src https://www.google.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
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
