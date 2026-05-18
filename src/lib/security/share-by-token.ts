import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";
import { createHash } from "node:crypto";
import { hashToken } from "@/lib/security/token-hash";

type DeadlineRow = Pick<
  Database["public"]["Tables"]["deadlines"]["Row"],
  | "id"
  | "name"
  | "deadline_type"
  | "due_date"
  | "status"
  | "governing_agency"
  | "severity_tier"
  | "penalty_estimate_cents"
  | "source_url"
  | "statute_citation"
>;

export type ShareViewPayload = {
  expires_at: string;
  label: string | null;
  view_count: number;
  business: { id: string; name: string };
  deadlines: DeadlineRow[];
};

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Server-only: load share page data after validating the raw token.
 * Honors expires_at and revoked_at. Records a view in the same call.
 */
export async function loadShareViewByToken(
  rawToken: string,
  viewer?: { ip?: string | null; userAgent?: string | null }
): Promise<ShareViewPayload | null> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: shareToken } = await supabase
    .from("share_tokens")
    .select("business_id, expires_at, label, view_count, revoked_at")
    // token_hash replaces the plaintext token column dropped in
    // 20260517000002_audit_remediation; lookup is by sha256(rawToken).
    // Cast: supabase types haven't been regenerated for the new column yet.
    .eq("token_hash" as never, hashToken(rawToken))
    .gt("expires_at", nowIso)
    .is("revoked_at", null)
    .maybeSingle();

  if (!shareToken) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", shareToken.business_id)
    .maybeSingle();

  if (!business) return null;

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select(
      "id, name, deadline_type, due_date, status, governing_agency, severity_tier, penalty_estimate_cents, source_url, statute_citation"
    )
    .eq("business_id", business.id)
    .order("due_date", { ascending: true });

  // Fire-and-forget view record. Failure here must not break the share page.
  if (viewer) {
    void supabase
      .rpc("record_share_view", {
        p_token: rawToken,
        p_ip_hash: hashIp(viewer.ip ?? null),
        p_user_agent: (viewer.userAgent ?? "").slice(0, 120),
      })
      .then(() => undefined);
  }

  return {
    expires_at: shareToken.expires_at,
    label: shareToken.label,
    view_count: shareToken.view_count,
    business,
    deadlines: deadlines ?? [],
  };
}
