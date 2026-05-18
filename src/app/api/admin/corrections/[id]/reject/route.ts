import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCorrectionStatusEmail } from "@/lib/email";

export const runtime = "nodejs";

// POST /api/admin/corrections/[id]/reject
//
// Body: { review_note: string } — required, surfaced back to the
// proposing accountant when we expose the "my corrections" view to them
// in a follow-on. The RPC enforces non-empty review_note + FOR UPDATE
// serialisation against a concurrent accept.
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
  const reviewNote = body && typeof body === "object" && "review_note" in body
    ? (body as { review_note: unknown }).review_note
    : null;
  if (typeof reviewNote !== "string" || reviewNote.trim().length === 0) {
    return NextResponse.json({ error: "review_note required" }, { status: 400 });
  }
  if (reviewNote.length > 2000) {
    return NextResponse.json({ error: "review_note too long" }, { status: 400 });
  }

  // reject_correction is granted to service_role only after the audit-
  // remediation migration. requirePlatformAdminForRoute above proves the
  // caller is an admin; routing through the admin client is safe.
  const admin = createAdminClient();
  const rpc = admin.rpc as unknown as (
    fn: "reject_correction",
    params: { p_correction_id: string; p_review_note: string }
  ) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>;

  const { error } = await rpc("reject_correction", {
    p_correction_id: id,
    p_review_note: reviewNote,
  });

  if (error) {
    if (error.code === "42501") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error.code === "22023") {
      return NextResponse.json(
        { error: "Correction already resolved. Reload to see its status." },
        { status: 409 }
      );
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Correction not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Reject failed" }, { status: 500 });
  }

  const { error: auditError } = await admin.from("audit_events").insert({
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.correction_rejected",
    target_id: id,
    metadata: { review_note: reviewNote },
  });
  if (auditError) {
    console.error("audit_insert_failed", {
      event_type: "platform.correction_rejected",
      target_id: id,
      error: auditError.message,
    });
  }

  // Refresh confidence so rejected_count bumps reflect immediately.
  const refreshRpc = admin.rpc as unknown as (
    fn: "refresh_rule_confidence"
  ) => Promise<{ error: { message: string } | null }>;
  const { error: refreshError } = await refreshRpc("refresh_rule_confidence");
  if (refreshError) {
    console.error("[corrections] refresh_rule_confidence failed", refreshError.message);
  }

  // Notify the proposer (fire-and-forget).
  void (async () => {
    try {
      const { data: correction } = await admin
        .from("rule_corrections")
        .select("proposed_by_connection_id, rule_id")
        .eq("id", id)
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

      if (!process.env.RESEND_API_KEY) return;
      await sendCorrectionStatusEmail({
        to: connection.accountant_email,
        ruleName: rule?.name ?? "(rule)",
        status: "rejected",
        reviewNote,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://operatoros.com",
      });
    } catch (err) {
      console.error("[corrections] correction-status email failed", err);
    }
  })();

  return NextResponse.json({ ok: true });
}
