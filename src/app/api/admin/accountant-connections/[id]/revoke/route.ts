import { NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("accountant_connections")
    .select("id, business_id, accountant_email, revoked_at")
    .eq("id", id)
    .maybeSingle();
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conn.revoked_at) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("accountant_connections")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return dbError("admin:accountant-connections/revoke", error);

  const { writeAuditEvent } = await import("@/lib/audit-log");
  await writeAuditEvent(admin, {
    business_id: conn.business_id,
    actor_user_id: auth.user.id,
    event_type: "platform.accountant_connection_revoked",
    target_id: id,
    metadata: { accountant_email: conn.accountant_email },
  });

  return NextResponse.json({ ok: true });
}
