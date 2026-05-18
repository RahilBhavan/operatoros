import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 'unsafe-eval' is needed for Next.js dev HMR; it is dropped in production.
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com",
].join("; ");

const nextConfig: NextConfig = {
  async rewrites() {
    // Guarantee PWA assets on Vercel when public/ static serving is skipped.
    return [
      { source: "/sw.js", destination: "/api/pwa/sw" },
      { source: "/offline.html", destination: "/api/pwa/offline" },
    ];
  },
  async headers() {
    const base = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Content-Security-Policy", value: csp },
    ];
    if (isProd) {
      base.unshift({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }
    // Service worker needs a specific content-type, no caching, and a
    // narrow CSP. Without these, browsers reject the registration or serve
    // stale SW code across deploys (WS-3.5).
    const swHeaders = [
      { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Service-Worker-Allowed", value: "/" },
    ];

    return [
      { source: "/sw.js", headers: swHeaders },
      { source: "/api/pwa/sw", headers: swHeaders },
      { source: "/(.*)", headers: base },
    ];
  },
};

export default nextConfig;
