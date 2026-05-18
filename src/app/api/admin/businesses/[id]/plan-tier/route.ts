import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminForRoute } from "@/lib/security/admin-route";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

const PlanSchema = z.object({
  plan_tier: z.enum(["free", "business", "accountant"]),
  billing_status: z.enum([
    "trialing",
    "active",
    "past_due",
    "canceled",
    "inactive",
  ]),
  reason: z.string().min(1).max(280),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePlatformAdminForRoute();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: before } = await admin
    .from("businesses")
    .select("plan_tier, billing_status")
    .eq("id", id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await admin
    .from("businesses")
    .update({
      plan_tier: parsed.data.plan_tier,
      billing_status: parsed.data.billing_status,
    })
    .eq("id", id);
  if (error) return dbError("admin:businesses/plan-tier", error);

  const { writeAuditEvent } = await import("@/lib/audit-log");
  await writeAuditEvent(admin, {
    business_id: id,
    actor_user_id: auth.user.id,
    event_type: "platform.plan_tier_forced",
    target_id: id,
    metadata: {
      from: before,
      to: { plan_tier: parsed.data.plan_tier, billing_status: parsed.data.billing_status },
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true });
}
