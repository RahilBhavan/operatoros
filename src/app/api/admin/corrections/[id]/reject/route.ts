import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
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

  const admin = createAdminClient();
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

  return NextResponse.json({ ok: true });
}
