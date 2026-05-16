import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/admin/corrections/[id]/accept
//
// Calls accept_correction(p_correction_id) which runs FOR UPDATE on the
// correction row + forks v+1 of the underlying rule via
// version_regulatory_rule. The accept RPC runs as the calling user
// (security definer + auth.uid()) so the is_platform_admin() guard inside
// resolves correctly. After commit we kick off a refresh of the
// rule_confidence materialized view via the service-role refresh function
// so the dashboard badge reflects the change within the next request.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: "accept_correction",
    params: { p_correction_id: string }
  ) => Promise<{ data: string | null; error: { code?: string; message: string } | null }>;

  const { data: newRuleId, error } = await rpc("accept_correction", {
    p_correction_id: id,
  });

  if (error || !newRuleId) {
    if (error?.code === "42501") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error?.code === "22023") {
      return NextResponse.json(
        { error: "Correction already resolved. Reload to see its status." },
        { status: 409 }
      );
    }
    if (error?.code === "P0002") {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Accept failed" }, { status: 500 });
  }

  // Audit — same shape the verify/edit routes use. The accept RPC has
  // already committed; audit failure shouldn't roll back the user action.
  const admin = createAdminClient();
  const { error: auditError } = await admin.from("audit_events").insert({
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.correction_accepted",
    target_id: id,
    metadata: { new_rule_id: newRuleId },
  });
  if (auditError) {
    console.error("audit_insert_failed", {
      event_type: "platform.correction_accepted",
      target_id: id,
      error: auditError.message,
    });
  }

  // Best-effort refresh of the materialized view. Service-role only.
  const refreshRpc = admin.rpc as unknown as (
    fn: "refresh_rule_confidence"
  ) => Promise<{ error: { message: string } | null }>;
  const { error: refreshError } = await refreshRpc("refresh_rule_confidence");
  if (refreshError) {
    console.error("[corrections] refresh_rule_confidence failed", refreshError.message);
  }

  return NextResponse.json({ ok: true, new_rule_id: newRuleId });
}
