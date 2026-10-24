// Per-request nonce-based Content-Security-Policy.
//
// The proxy (`src/proxy.ts`) generates a fresh nonce per request and sets the
// same `Content-Security-Policy` value on BOTH the forwarded request headers
// and the response. Next.js parses the nonce out of the request's CSP header
// (`'nonce-...'` in script-src) and applies it to its framework and hydration
// scripts; the response header is what the browser enforces. Setting only
// `x-nonce` or only the response header leaves Next's scripts un-nonced, and
// `'strict-dynamic'` then makes the browser block them.
//
// A nonce only works if the HTML is rendered per request. Pages that are
// prerendered at build time cannot carry one, so the root layout calls
// `connection()` to opt every route into dynamic rendering.
//
// `'strict-dynamic'` lets a nonced script load further scripts (Next's chunk
// loader uses this pattern), so we don't need to nonce every dynamically
// imported chunk. Production drops `'unsafe-inline'` from script-src entirely;
// dev keeps `'unsafe-eval'` for React Refresh / HMR.

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function buildCsp(nonce: string, mode: "dev" | "prod"): string {
  const scriptSrc =
    mode === "prod"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;
  return [
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
}
