import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCorrectionStatusEmail } from "@/lib/email";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

// POST /api/admin/corrections/[id]/accept
//
// Calls accept_correction(p_correction_id) which runs FOR UPDATE on the
// correction row + forks v+1 of the underlying rule via
// version_regulatory_rule. The accept RPC is granted to service_role only
// (per the audit-remediation migration's defence-in-depth GRANT lockdown),
// so we call it through the admin client AFTER requirePlatformAdminForRoute
// has verified the caller is a platform admin. The is_platform_admin()
// guard inside the RPC still resolves correctly because the admin client
// passes through auth.uid() via the request JWT.
//
// After commit we kick off a refresh of the rule_confidence materialized
// view so the dashboard badge reflects the change within the next request.
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

  const admin = createAdminClient();
  const rpc = admin.rpc.bind(admin) as unknown as (
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
    return dbError("admin:corrections/accept", error);
  }

  // Audit — same shape the verify/edit routes use. The accept RPC has
  // already committed; audit failure shouldn't roll back the user action.
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
  const refreshRpc = admin.rpc.bind(admin) as unknown as (
    fn: "refresh_rule_confidence"
  ) => Promise<{ error: { message: string } | null }>;
  const { error: refreshError } = await refreshRpc("refresh_rule_confidence");
  if (refreshError) {
    console.error("[corrections] refresh_rule_confidence failed", refreshError.message);
  }

  // Fire-and-forget email to the accountant who proposed the correction.
  void notifyProposer(admin, id, "accepted");

  return NextResponse.json({ ok: true, new_rule_id: newRuleId });
}

async function notifyProposer(
  admin: ReturnType<typeof createAdminClient>,
  correctionId: string,
  status: "accepted" | "rejected",
  reviewNote?: string | null
) {
  try {
    const { data: correction } = await admin
      .from("rule_corrections")
      .select("proposed_by_connection_id, rule_id")
      .eq("id", correctionId)
      .maybeSingle();
    if (!correction?.proposed_by_connection_id) return;

    const { data: connection } = await admin
      .from("accountant_connections")
      .select("accountant_email")
      .eq("id", correction.proposed_by_connection_id)
      .maybeSingle();
    if (!connection?.accountant_email) return;

    const { data: rule } = await admin
      .from("regulatory_rules")
      .select("name")
      .eq("id", correction.rule_id)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://operatoros.com";
    if (!process.env.RESEND_API_KEY) return;

    await sendCorrectionStatusEmail({
      to: connection.accountant_email,
      ruleName: rule?.name ?? "(rule)",
      status,
      reviewNote,
      appUrl,
    });
  } catch (err) {
    console.error("[corrections] correction-status email failed", err);
  }
}
