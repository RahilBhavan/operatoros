import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";

export const runtime = "nodejs";

/**
 * WS-2.3 — Log a CE credit against a specific staff credential. Used by
 * the per-staff CE tab to record continuing-education hours toward a
 * credential's renewal cycle.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: staffCredentialId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const hours = typeof body.hours === "number" ? body.hours : NaN;
  const completedAt =
    typeof body.completed_at === "string"
      ? body.completed_at.slice(0, 10)
      : "";
  if (!Number.isFinite(hours) || hours <= 0 || !completedAt) {
    return NextResponse.json(
      { error: "hours (>0) and completed_at required" },
      { status: 400 }
    );
  }

  const expectedStaffMemberId =
    typeof body.staff_member_id === "string" ? body.staff_member_id : null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const baa = await checkBaaForPhi(supabase, {
    businessId: business.id,
    industrySlug: business.industry_slug,
  });
  if (baa) return NextResponse.json({ error: baa.error }, { status: baa.status });

  // Cross-check: the credential belongs to this business AND (if the
  // caller named the staff_member_id) matches the path param. Closes the
  // defense-in-depth gap the audit flagged where an attacker who knew
  // another tenant's credential UUID could log CE hours against it.
  const { data: cred } = await supabase
    .from("staff_credentials")
    .select("id, staff_member_id")
    .eq("id", staffCredentialId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!cred) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }
  if (
    expectedStaffMemberId !== null &&
    expectedStaffMemberId !== cred.staff_member_id
  ) {
    return NextResponse.json(
      { error: "Credential does not belong to that staff member." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("ce_credits")
    .insert({
      staff_credential_id: staffCredentialId,
      business_id: business.id,
      hours,
      completed_at: completedAt,
      category:
        typeof body.category === "string" && body.category.length > 0
          ? body.category.slice(0, 100)
          : null,
      course_name:
        typeof body.course_name === "string" && body.course_name.length > 0
          ? body.course_name.slice(0, 200)
          : null,
      provider:
        typeof body.provider === "string" && body.provider.length > 0
          ? body.provider.slice(0, 200)
          : null,
      source_url:
        typeof body.source_url === "string" && body.source_url.length > 0
          ? body.source_url.slice(0, 2000)
          : null,
      notes:
        typeof body.notes === "string" && body.notes.length > 0
          ? body.notes.slice(0, 4000)
          : null,
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("staff/credentials/ce/POST", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "update",
    userId: user.id,
    staffCredentialId,
  });

  return NextResponse.json({ id: data.id });
}
