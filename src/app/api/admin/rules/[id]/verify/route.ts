import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateRulesCache } from "@/lib/regulatory-graph";
import { dbError } from "@/lib/api/respond";
import { writeAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

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
  const verifiedAt = new Date().toISOString();

  // regulatory_rules isn't in the generated Database type yet (types
  // regenerate after migration apply); cast through unknown for the
  // narrow update we're performing here.
  const updater = (admin.from("regulatory_rules" as never) as unknown as {
    update(row: Record<string, unknown>): {
      eq(col: string, val: string): Promise<{ error: { message: string } | null }>;
    };
  })
    .update({ last_verified_at: verifiedAt, last_verified_by: auth.user.id })
    .eq("id", id);

  const { error } = await updater;
  if (error) {
    return dbError("admin:rules/verify", error);
  }

  await writeAuditEvent(admin, {
    business_id: null,
    actor_user_id: auth.user.id,
    event_type: "platform.rule_verified",
    target_id: id,
    metadata: { verified_at: verifiedAt },
  });

  // Mark the in-process rule cache stale so the next onboarding read
  // pulls the updated last_verified_at (which feeds Workstream B
  // confidence tiers when those land).
  invalidateRulesCache();

  return NextResponse.json({ ok: true, last_verified_at: verifiedAt });
}
