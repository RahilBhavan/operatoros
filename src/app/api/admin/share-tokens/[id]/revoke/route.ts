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

  const { data: token } = await admin
    .from("share_tokens")
    .select("id, business_id, revoked_at, label")
    .eq("id", id)
    .maybeSingle();
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (token.revoked_at) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("share_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return dbError("admin:share-tokens/revoke", error);

  const { writeAuditEvent } = await import("@/lib/audit-log");
  await writeAuditEvent(admin, {
    business_id: token.business_id,
    actor_user_id: auth.user.id,
    event_type: "platform.share_token_revoked",
    target_id: id,
    metadata: { label: token.label },
  });

  return NextResponse.json({ ok: true });
}
