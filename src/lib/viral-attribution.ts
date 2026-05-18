/**
 * WS-D — Viral attribution helpers shared between the public /i/[code]
 * redirect route, the onboarding action, the Stripe webhook, and the
 * accountant settings UI.
 *
 * The cookie convention:
 *   • Name `invite_code` (mirrors the migration column name).
 *   • HttpOnly, SameSite=Lax, 1-hour TTL (matches the roadmap spec).
 *   • Cleared on first successful consumption inside completeOnboarding.
 */

import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const INVITE_CODE_COOKIE = "invite_code";
export const INVITE_CODE_TTL_SECONDS = 60 * 60; // 1 hour

const CODE_BYTES = 6; // 12 hex chars — collision-safe across millions of links

export function generateInviteCode(): string {
  return randomBytes(CODE_BYTES).toString("hex");
}

export type InviteLinkRow =
  Database["public"]["Tables"]["accountant_invite_links"]["Row"];

/**
 * Look up an active (non-revoked) invite link by code. Returns null on miss
 * or revoked. Caller is expected to hold a service-role client because
 * the cookie-bearing visitor is unauthenticated.
 */
export async function loadActiveInviteLink(
  admin: SupabaseClient<Database>,
  code: string
): Promise<InviteLinkRow | null> {
  const trimmed = code.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 64) return null;
  const { data } = await admin
    .from("accountant_invite_links")
    .select("*")
    .eq("code", trimmed)
    .is("revoked_at", null)
    .maybeSingle();
  return data ?? null;
}

/**
 * Increment a counter on an invite link. Returns ok=false on miss; logs but
 * does not throw on error so callers can stay fire-and-forget.
 */
export async function incrementInviteLinkCounter(
  admin: SupabaseClient<Database>,
  inviteLinkId: string,
  field: "signups_count" | "paid_conversions_count"
): Promise<{ ok: boolean; newValue?: number; error?: string }> {
  const { data: current, error: readErr } = await admin
    .from("accountant_invite_links")
    .select(field)
    .eq("id", inviteLinkId)
    .maybeSingle();
  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? "Link not found" };
  }
  const next = ((current as Record<string, number>)[field] ?? 0) + 1;
  const update: Database["public"]["Tables"]["accountant_invite_links"]["Update"] =
    field === "signups_count"
      ? { signups_count: next }
      : { paid_conversions_count: next };
  const { error: writeErr } = await admin
    .from("accountant_invite_links")
    .update(update)
    .eq("id", inviteLinkId);
  if (writeErr) return { ok: false, error: writeErr.message };
  return { ok: true, newValue: next };
}
