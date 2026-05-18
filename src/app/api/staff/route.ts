import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

const VALID_EMPLOYMENT = new Set(["w2", "1099", "volunteer", "owner", "other"]);

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

  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  if (!fullName || fullName.length > 200) {
    return NextResponse.json(
      { error: "full_name required (1-200 chars)" },
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

  const email =
    typeof body.email === "string" && body.email.length > 0
      ? body.email.slice(0, 320)
      : null;
  const role =
    typeof body.role === "string" && body.role.length > 0
      ? body.role.slice(0, 100)
      : null;
  const employmentType =
    typeof body.employment_type === "string" &&
    VALID_EMPLOYMENT.has(body.employment_type)
      ? (body.employment_type as
          | "w2"
          | "1099"
          | "volunteer"
          | "owner"
          | "other")
      : null;
  const hireDate =
    typeof body.hire_date === "string" && body.hire_date.length > 0
      ? body.hire_date.slice(0, 10)
      : null;

  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      business_id: business.id,
      full_name: fullName,
      email,
      role,
      employment_type: employmentType,
      hire_date: hireDate,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("staff/POST", error);
  }

  return NextResponse.json({ id: data.id });
}
