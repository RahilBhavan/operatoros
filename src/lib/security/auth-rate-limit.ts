"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthRateLimitScope = "signin" | "signup" | "password_reset";

type Outcome =
  | { allowed: true }
  | { allowed: false; reason: "rate_limited" };

const LIMITS: Record<AuthRateLimitScope, { max: number; windowSeconds: number }> = {
  signin: { max: 5, windowSeconds: 15 * 60 },
  signup: { max: 5, windowSeconds: 15 * 60 },
  password_reset: { max: 3, windowSeconds: 15 * 60 },
};

async function callerIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "0.0.0.0";
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Returns `{ allowed: true }` when the caller may proceed with their auth
// attempt, or `{ allowed: false, reason: "rate_limited" }` when they've hit
// the throttle and should be told to wait. The throttle is keyed on
// (scope, ip, email) so a single attacker cannot hammer one account from
// many IPs *and* a single IP cannot hammer many emails — both axes get
// independently throttled by the (ip,email) tuple.
export async function checkAuthRateLimit(
  scope: AuthRateLimitScope,
  email: string
): Promise<Outcome> {
  const ip = await callerIp();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { allowed: true };
  }
  const key = `auth:${scope}:${ip}:${normalizedEmail}`;
  const { max, windowSeconds } = LIMITS[scope];

  const admin = createAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
    fn: "try_consume_auth_rate_limit",
    params: { p_key: string; p_max_attempts: number; p_window_seconds: number }
  ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

  const { data, error } = await rpc("try_consume_auth_rate_limit", {
    p_key: key,
    p_max_attempts: max,
    p_window_seconds: windowSeconds,
  });

  // Fail-open on RPC error: if the rate-limit table is unreachable we still
  // let the user sign in. Supabase Auth has its own server-side rate-limit
  // as a backstop. Log the error so it surfaces in observability.
  if (error) {
    console.error("[auth-rate-limit] RPC error", error.message);
    return { allowed: true };
  }
  if (data === false) {
    return { allowed: false, reason: "rate_limited" };
  }
  return { allowed: true };
}
