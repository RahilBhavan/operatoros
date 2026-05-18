import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import {
  validateProposedChanges,
  validateRationale,
  validateCitationUrl,
} from "@/lib/corrections";

export const runtime = "nodejs";

// POST /api/accountant/corrections
//
// Token-authenticated accountant proposes a correction against a single
// regulatory_rules row. Rate-limited 10/hr per accountant connection so
// one compromised token can't flood the queue.
//
// Body:
//   token: accountant connection token (string)
//   rule_id: uuid of the regulatory_rules row to correct
//   proposed_changes: partial diff over editable fields (same shape the
//     /api/admin/rules/[id]/edit route accepts)
//   rationale: required, 8..4000 chars
//   citation_url: optional, http(s)://
//
// On success, returns { ok: true, correction_id }. Status starts 'pending';
// admin must accept/reject through /admin/corrections.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const token = typeof b.token === "string" ? b.token : null;
  const ruleId = typeof b.rule_id === "string" ? b.rule_id : null;
  if (!token || !ruleId) {
    return NextResponse.json({ error: "token and rule_id required" }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(ruleId)) {
    return NextResponse.json({ error: "rule_id must be a UUID" }, { status: 400 });
  }

  const changes = validateProposedChanges(b.proposed_changes);
  if (!changes.ok) {
    return NextResponse.json({ error: changes.error }, { status: 400 });
  }
  const rationale = validateRationale(b.rationale);
  if (!rationale.ok) {
    return NextResponse.json({ error: rationale.error }, { status: 400 });
  }
  const citation = validateCitationUrl(b.citation_url);
  if (!citation.ok) {
    return NextResponse.json({ error: citation.error }, { status: 400 });
  }

  const admin = createAdminClient();

  // Resolve the token to a live, non-revoked, non-expired connection. We
  // never reveal whether the token is wrong vs. revoked vs. expired — same
  // 403 either way.
  const { data: connection } = await admin
    .from("accountant_connections")
    .select("id, business_id, expires_at, revoked_at")
    // token_hash replaces the dropped plaintext token column.
    // Cast: generated supabase types haven't regenerated for new column.
    .eq("token_hash" as never, hashToken(token))
    .maybeSingle();

  if (
    !connection ||
    connection.revoked_at ||
    new Date(connection.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit: 10/hr per connection. Reuses the generic auth rate-limit
  // RPC from workstream A — it takes an arbitrary key + window + max.
  const rateRpc = admin.rpc as unknown as (
    fn: "try_consume_auth_rate_limit",
    params: { p_key: string; p_max_attempts: number; p_window_seconds: number }
  ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

  const { data: allowed, error: rateError } = await rateRpc("try_consume_auth_rate_limit", {
    p_key: `correction:${connection.id}`,
    p_max_attempts: 10,
    p_window_seconds: 60 * 60,
  });
  if (rateError) {
    console.error("[corrections] rate-limit RPC failed", rateError.message);
    // Fail-open on RPC error — same posture as auth-rate-limit. The
    // backstop is the per-rule index that makes duplicate scans cheap to
    // review and the admin queue UI that visualises spam.
  } else if (allowed === false) {
    return NextResponse.json(
      { error: "Too many corrections. Try again in an hour." },
      { status: 429 }
    );
  }

  // Verify the rule exists and is still the head of its chain. Submitting
  // a correction against a superseded row would silently never propagate
  // — surface the error instead.
  // regulatory_rules isn't in the generated Database type yet (types
  // regenerate after migration apply); cast for this narrow read.
  const rulesRead = admin.from("regulatory_rules" as never) as unknown as {
    select(cols: string): {
      eq(col: string, val: string): {
        maybeSingle(): Promise<{
          data: { id: string; superseded_by: string | null; sunset_date: string | null } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  const { data: rule } = await rulesRead
    .select("id, superseded_by, sunset_date")
    .eq("id", ruleId)
    .maybeSingle();

  if (!rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  if (rule.superseded_by || rule.sunset_date) {
    return NextResponse.json(
      { error: "Rule has been superseded. Reload to see the current version." },
      { status: 409 }
    );
  }

  // Insert the correction. rule_corrections isn't in the generated type yet
  // either — same cast pattern.
  const insertCorrection = admin.from("rule_corrections" as never) as unknown as {
    insert(row: Record<string, unknown>): {
      select(cols: string): {
        single(): Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  const { data: inserted, error: insertError } = await insertCorrection
    .insert({
      rule_id: ruleId,
      proposed_by_connection_id: connection.id,
      proposed_by_kind: "accountant",
      proposed_changes: changes.value,
      rationale: rationale.value,
      citation_url: citation.value,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[corrections] insert failed", insertError?.message);
    return NextResponse.json({ error: "Failed to record correction" }, { status: 500 });
  }

  // Audit event — platform-level (business_id null) since corrections
  // aren't scoped to one tenant. actor_user_id is null because accountants
  // don't have auth.users rows; the connection id is the actor and lives
  // in metadata.
  const { error: auditError } = await admin.from("audit_events").insert({
    business_id: connection.business_id,
    actor_user_id: null,
    event_type: "accountant.correction_submitted",
    target_id: inserted.id,
    metadata: {
      rule_id: ruleId,
      connection_id: connection.id,
      proposed_field_count: Object.keys(changes.value).length,
    },
  });
  if (auditError) {
    console.error("audit_insert_failed", {
      event_type: "accountant.correction_submitted",
      target_id: inserted.id,
      error: auditError.message,
    });
  }

  return NextResponse.json({ ok: true, correction_id: inserted.id });
}
