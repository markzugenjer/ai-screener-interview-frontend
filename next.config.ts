import type { NextConfig } from "next";

// Headers for every response. The Content-Security-Policy is set per request
// in src/proxy.ts because it carries a fresh nonce.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The microphone is needed for the interview; everything else is off.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle (server.js + traced node_modules) for the container image.
  output: "standalone",
  reactStrictMode: true,
  // Pages are rendered per request (needed for CSP nonces and per-user data).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // /api/v1/* (and, for the voice agent, /internal/*) are forwarded to the Go API by
  // route handlers that read API_INTERNAL_URL at runtime (a rewrite here would be
  // fixed at build time). See src/lib/forward.ts.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
