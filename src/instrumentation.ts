/**
 * Runs once when the Next.js server starts (and during production builds).
 * Validates env so Vercel deploys fail fast when secrets are missing.
 */
export async function register() {
  // Fail fast on Vercel when Supabase/CRON secrets are missing (build + cold start).
  if (process.env.VERCEL === "1" && process.env.NODE_ENV === "production") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
