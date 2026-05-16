import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateRulesCache } from "@/lib/regulatory-graph";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";

/**
 * POST /api/admin/rules/[id]/edit
 *
 * Body: { changes: Record<string, unknown> } — partial diff over the rule's
 * editable fields. Calls the `version_regulatory_rule` RPC, which forks
 * a new v+1 row and points the prior row's superseded_by at it. The RPC
 * runs as the calling user (security definer + auth.uid()) so the
 * is_platform_admin() check inside it matches what RLS would see.
 *
 * Returns: { ok: true, new_rule_id: uuid } on success.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("changes" in body)) {
    return NextResponse.json({ error: "Missing changes" }, { status: 400 });
  }
  const changes = (body as { changes: unknown }).changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    return NextResponse.json({ error: "changes must be an object" }, { status: 400 });
  }
  const validation = validateChanges(changes as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // The RPC runs as the calling user — uses the server client (cookie auth)
  // not the service-role client, so auth.uid() resolves and the
  // is_platform_admin() guard inside the function fires correctly.
  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: "version_regulatory_rule",
    params: { p_rule_id: string; p_changes: Record<string, unknown> }
  ) => Promise<{ data: string | null; error: { code?: string; message: string } | null }>;

  const { data: newRuleId, error } = await rpc("version_regulatory_rule", {
    p_rule_id: id,
    p_changes: validation.value,
  });

  if (error || !newRuleId) {
    if (error?.code === "42501") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error?.code === "22023") {
      return NextResponse.json(
        { error: "This rule has already been superseded. Reload to see the latest version." },
        { status: 409 }
      );
    }
    if (error?.code === "P0002") {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Version create failed" }, { status: 500 });
  }

  // Audit. Service-role for the insert so a failure to log doesn't roll back
  // the user-visible action (which the RPC already committed).
  const admin = createAdminClient();
  const { error: auditError } = await admin.from("audit_events").insert({
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.rule_versioned",
    target_id: newRuleId,
    metadata: { from_rule_id: id, changes: validation.value as Json },
  });
  if (auditError) {
    console.error("audit_insert_failed", {
      event_type: "platform.rule_versioned",
      from_rule_id: id,
      new_rule_id: newRuleId,
      error: auditError.message,
    });
  }

  // The edit is now the new canonical head; bust the in-process cache so
  // the next onboarding read sees v+1 immediately (otherwise cached
  // LEGACY_RULES / v_old would still serve for up to 10 minutes).
  invalidateRulesCache();

  return NextResponse.json({ ok: true, new_rule_id: newRuleId });
}

const STRING_FIELDS = [
  "name",
  "description",
  "deadline_type",
  "governing_agency",
  "frequency",
  "source_url",
  "statute_citation",
] as const;
const SEVERITY_VALUES = ["critical", "high", "medium", "low", "info"] as const;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateChanges(
  raw: Record<string, unknown>
):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string } {
  const out: Record<string, unknown> = {};

  for (const f of STRING_FIELDS) {
    if (!(f in raw)) continue;
    const v = raw[f];
    if (v === null || v === "") {
      // empty/null is allowed for source_url + statute_citation; everything
      // else must stay non-empty (the RPC coalesces null back to old value).
      if (f === "source_url" || f === "statute_citation") {
        out[f] = "";
        continue;
      }
      return { ok: false, error: `${f} cannot be empty` };
    }
    if (typeof v !== "string") return { ok: false, error: `${f} must be a string` };
    if (v.length > 2000) return { ok: false, error: `${f} too long` };
    out[f] = v;
  }

  if ("severity_tier" in raw) {
    const v = raw.severity_tier;
    if (typeof v !== "string" || !SEVERITY_VALUES.includes(v as (typeof SEVERITY_VALUES)[number])) {
      return { ok: false, error: "Invalid severity_tier" };
    }
    out.severity_tier = v;
  }

  if ("penalty_estimate_cents" in raw) {
    const v = raw.penalty_estimate_cents;
    if (v === null || v === "") {
      out.penalty_estimate_cents = "";
    } else {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return { ok: false, error: "penalty_estimate_cents must be a non-negative integer" };
      }
      out.penalty_estimate_cents = String(n);
    }
  }

  for (const f of ["effective_date", "sunset_date"] as const) {
    if (!(f in raw)) continue;
    const v = raw[f];
    if (v === null || v === "") {
      if (f === "sunset_date") {
        out.sunset_date = "";
        continue;
      }
      return { ok: false, error: `${f} cannot be empty` };
    }
    if (typeof v !== "string" || !ISO_DATE_RE.test(v)) {
      return { ok: false, error: `${f} must be YYYY-MM-DD` };
    }
    out[f] = v;
  }

  for (const f of ["due_date_rule", "applies_when"] as const) {
    if (!(f in raw)) continue;
    const v = raw[f];
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, error: `${f} must be an object` };
    }
    out[f] = v;
  }

  if (Object.keys(out).length === 0) {
    return { ok: false, error: "No changes provided" };
  }
  return { ok: true, value: out };
}
