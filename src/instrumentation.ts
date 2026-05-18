/**
 * Runs once when the Next.js server starts (and during production builds).
 * Validates env so Vercel deploys fail fast when secrets are missing.
 */
export async function register() {
  // Only validate on Vercel production builds — GitHub CI may omit secrets.
  if (
    process.env.NEXT_PHASE === "phase-production-build" &&
    process.env.VERCEL === "1"
  ) {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
