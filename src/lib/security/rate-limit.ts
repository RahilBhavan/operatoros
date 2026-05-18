import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Generic rate-limit helper that wraps the SQL try_consume_auth_rate_limit
// RPC. Callers pass an opaque key (which they should namespace) plus a
// max-attempts count and a window in seconds. Returns true if the caller is
// under the limit and may proceed, false if rate-limited.
//
// Fails open on RPC errors so a Supabase outage doesn't take down the route;
// the same fail-open philosophy as src/lib/security/auth-rate-limit.ts.
export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const admin = createAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
    fn: "try_consume_auth_rate_limit",
    params: { p_key: string; p_max_attempts: number; p_window_seconds: number }
  ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

  const { data, error } = await rpc("try_consume_auth_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] RPC error", error.message, { key });
    return true;
  }
  return data !== false;
}

// Hash an IP address to avoid storing raw client IPs in the rate-limit key.
// Truncated to 16 hex chars — still ~64 bits of entropy, plenty to keep
// distinct IPs in distinct buckets without exposing the address.
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
