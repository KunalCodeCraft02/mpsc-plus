import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Play Console / external-facing aliases for the existing public legal
  // pages. The content lives only at /privacy and /terms (single source of
  // truth); these just give those same pages the URL shape Play Console and
  // other external listings expect. /refund-policy and /copyright-policy
  // already use that shape, so no alias is needed for them.
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
    ];
  },
};

export default nextConfig;
