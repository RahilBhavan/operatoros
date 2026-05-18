/**
 * Canonical app origin for emails, Stripe redirects, and share links.
 * Prefers NEXT_PUBLIC_APP_URL; falls back to VERCEL_URL on Preview deploys.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}
