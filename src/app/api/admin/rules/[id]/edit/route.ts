import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateRulesCache } from "@/lib/regulatory-graph";
import { dbError } from "@/lib/api/respond";
import { validateProposedChanges } from "@/lib/corrections";
import { writeAuditEvent } from "@/lib/audit-log";

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
  // Shared validator with the accountant corrections route — keeps the
  // admin edit and accountant flag paths on identical field rules
  // (severity tiers, frequency enum, ISO dates, penalty cents). Adding
  // a new allowed field updates both flows in one place.
  const validation = validateProposedChanges(
    (body as { changes: unknown }).changes
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // version_regulatory_rule is granted to service_role only (defence-in-
  // depth lockdown in the audit-remediation migration). The route-level
  // requirePlatformAdminForRoute above is now the authorization boundary.
  const admin = createAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
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
    return dbError("admin:rules/edit", error);
  }

  await writeAuditEvent(admin, {
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.rule_versioned",
    target_id: newRuleId,
    metadata: { from_rule_id: id, changes: validation.value },
  });

  // The edit is now the new canonical head; bust the in-process cache so
  // the next onboarding read sees v+1 immediately (otherwise cached
  // LEGACY_RULES / v_old would still serve for up to 10 minutes).
  invalidateRulesCache();

  return NextResponse.json({ ok: true, new_rule_id: newRuleId });
}

