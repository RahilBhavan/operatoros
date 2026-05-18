/**
 * Runs once when the Next.js server starts (and during production builds).
 * Validates env so Vercel deploys fail fast when secrets are missing.
 */
export async function register() {
  // Fail the Vercel *build* when secrets are missing — do not throw on cold start
  // (that would 500 every route including the marketing homepage).
  if (
    process.env.NEXT_PHASE === "phase-production-build" &&
    process.env.VERCEL === "1"
  ) {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
