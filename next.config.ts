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
  async redirects() {
    return [{ source: "/", destination: "/investor/investments", permanent: false }];
  },
};
export default config;
