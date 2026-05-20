// Per-request nonce-based Content-Security-Policy.
//
// The middleware (`src/proxy.ts`) generates a fresh nonce per request, attaches
// it to the inbound request as `x-nonce` so Next.js auto-nonces its built-in
// hydration scripts, and sets `Content-Security-Policy` on the response.
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
