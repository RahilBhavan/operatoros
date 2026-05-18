import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const staffMemberId =
    typeof body.staff_member_id === "string" ? body.staff_member_id : "";
  const credentialTypeId =
    typeof body.credential_type_id === "string" ? body.credential_type_id : "";
  if (!staffMemberId || !credentialTypeId) {
    return NextResponse.json(
      { error: "staff_member_id and credential_type_id required" },
      { status: 400 }
    );
  }

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

  // Confirm the staff member belongs to this business (defense-in-depth on
  // top of the RLS check the insert will also do).
  const { data: staff } = await supabase
    .from("staff_members")
    .select("id")
    .eq("id", staffMemberId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const identifier =
    typeof body.identifier === "string" && body.identifier.length > 0
      ? body.identifier.slice(0, 200)
      : null;
  const issuedDate =
    typeof body.issued_date === "string" && body.issued_date.length > 0
      ? body.issued_date.slice(0, 10)
      : null;
  const expiresDate =
    typeof body.expires_date === "string" && body.expires_date.length > 0
      ? body.expires_date.slice(0, 10)
      : null;

  const { data, error } = await supabase
    .from("staff_credentials")
    .insert({
      staff_member_id: staffMemberId,
      credential_type_id: credentialTypeId,
      business_id: business.id,
      identifier,
      issued_date: issuedDate,
      expires_date: expiresDate,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "This credential is already on file for this staff member." },
        { status: 409 }
      );
    }
    return dbError("staff/credentials/POST", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "create",
    userId: user.id,
    staffCredentialId: data.id,
  });

  return NextResponse.json({ id: data.id });
}
